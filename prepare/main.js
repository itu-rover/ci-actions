module.exports = async function prepare(github, context, core, pullNumber) {
    for (const retryInterval of [5, 10, 20, 40, 80]) {
        const prInfo = await github.rest.pulls.get({
            ...context.repo,
            pull_number: pullNumber,
        }).data;

        if (prInfo.state !== "open") throw new Error("PR is not open anymore.");

        const { base, head } = prInfo;

        core.info(`PR base: ${base.ref} (${base.sha})`);
        core.info(`PR head: ${head.ref} (${head.sha})`);

        let mergedSha;
        if (prInfo.mergeable == null) {
            console.log(`PR mergeable state is unknown, retrying in ${retryInterval} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryInterval * 1000));
            continue;
        } else if (prInfo.mergeable) {
            core.info("PR is mergeable.");
            mergedSha = prInfo.merge_commit_sha;
        } else {
            throw new Error("PR is not mergeable."); // TODO
        }

        core.setOutput("merged-sha", mergedSha);
        return;
    }
    throw new Error("Not retrying anymore. It's likely that GitHub is having internal issues: check https://www.githubstatus.com.");
};
