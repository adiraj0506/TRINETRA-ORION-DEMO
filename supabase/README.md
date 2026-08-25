# Database setup

Two files, run in this exact order, in your Supabase project's **SQL Editor**
(left sidebar → SQL Editor → New query):

1. **`schema.sql`** — creates all tables (`states`, `claimants`, `claims`,
   `land_parcels`, `schemes`, `scheme_matches`), indexes, and public read
   policies. Requires the `postgis` extension — enable it first under
   Database → Extensions if you haven't already (see main README / roadmap).

2. **`seed.sql`** — 430 synthetic claim records across MP, Odisha, Telangana,
   and Tripura, generated to statistically match the published paper:
   - National approval rate lands at **48.84%** (paper: 49.02%)
   - Tripura highest approval (~65%), Telangana conflict rate tuned to ~29%
   - Real district names, invented village names and claimant names —
     no real claimant data is used anywhere in this project
   - Every claim has a geospatial parcel (`land_parcels.geom`) so the Atlas
     map has something real to render from day one

Paste the full contents of each file into the SQL Editor and click **Run**.
`seed.sql` starts with a `truncate`, so it's safe to re-run any time you want
to reset the demo data.

## Regenerating the seed data

The dataset is generated deterministically by `scripts/generate-seed.js`
(seeded random, so results are reproducible run to run). If you want to
change proportions, claim counts, or add a state, edit that script and
re-run:

```bash
node scripts/generate-seed.js
```

Don't hand-edit `seed.sql` directly — it's a build artifact.

## Verifying it worked

In the SQL Editor, run:

```sql
select state_code, status, count(*) from claims group by 1, 2 order by 1, 2;
```

You should see all four states with a mix of approved/pending/rejected rows.
