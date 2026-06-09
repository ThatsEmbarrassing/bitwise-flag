# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

Every user-facing change should ship with a changeset. To add one, run:

```sh
bun run changeset
```

Pick the semver bump (`patch` / `minor` / `major`) and write a short, human-readable
summary — that text is what lands in [CHANGELOG.md](../CHANGELOG.md). For breaking
(`major`) changes, also add a step-by-step entry to [MIGRATIONS.md](../MIGRATIONS.md).

The changeset files in this folder are consumed and deleted by the release workflow
when the **Version Packages** PR is merged.
