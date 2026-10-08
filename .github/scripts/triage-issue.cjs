const TITLE_RULES = [
  {
    pattern: /^\s*(?:\[bug\]|bug(?:fix)?|fix)(?:\([^)]*\))?\s*[:：-]/i,
    label: "bug",
    issueType: "Bug",
  },
  {
    pattern: /^\s*(?:\[feature\]|feat(?:ure)?)(?:\([^)]*\))?\s*[:：-]/i,
    label: "enhancement",
    issueType: "Feature",
  },
];

function classifyIssue(title, labelNames = []) {
  const normalizedLabels = new Set(labelNames.map((label) => label.toLowerCase()));

  if (normalizedLabels.has("bug")) {
    return { label: null, issueType: "Bug" };
  }

  if (normalizedLabels.has("enhancement")) {
    return { label: null, issueType: "Feature" };
  }

  const rule = TITLE_RULES.find(({ pattern }) => pattern.test(title));
  if (rule) {
    return {
      label: normalizedLabels.has(rule.label) ? null : rule.label,
      issueType: rule.issueType,
    };
  }

  return { label: null, issueType: "Task" };
}

async function triageIssue({ github, context, core }) {
  const issue = context.payload.issue;
  const { owner, repo } = context.repo;
  const labelNames = issue.labels.map((label) => (typeof label === "string" ? label : label.name));
  const classification = classifyIssue(issue.title, labelNames);
  const updates = [];

  if (classification.label) {
    await github.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issue.number,
      labels: [classification.label],
    });
    updates.push(`label=${classification.label}`);
  }

  const metadata = await github.graphql(
    `query IssueTriageMetadata($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
          issueType { id name }
        }
        issueTypes(first: 20) {
          nodes { id name isEnabled }
        }
      }
    }`,
    { owner, repo, number: issue.number },
  );

  const repository = metadata.repository;
  if (!repository.issue.issueType) {
    const desiredType = repository.issueTypes.nodes.find(
      (issueType) =>
        issueType.isEnabled &&
        issueType.name.toLowerCase() === classification.issueType.toLowerCase(),
    );

    if (desiredType) {
      await github.graphql(
        `mutation SetIssueType($issueId: ID!, $issueTypeId: ID!) {
          updateIssue(input: { id: $issueId, issueTypeId: $issueTypeId }) {
            issue { id }
          }
        }`,
        { issueId: repository.issue.id, issueTypeId: desiredType.id },
      );
      updates.push(`type=${desiredType.name}`);
    } else {
      core.warning(`Enabled issue type "${classification.issueType}" is unavailable.`);
    }
  }

  core.info(updates.length > 0 ? `Applied ${updates.join(", ")}.` : "Issue metadata is already set.");
}

module.exports = triageIssue;
module.exports.classifyIssue = classifyIssue;
