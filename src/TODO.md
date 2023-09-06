## Sync cases

[] add something directly to notion main DB
[] add something directly to notion snapshot DB
[] delete video directly from youtube playlist
[] delete something from notion snapshot DB

[] add empty page to notion main DB
[] add empty page to notion snapshot DB
[] youtube video directly added to main DB but missing in youtube playlist
[] add something invalid to sync to main DB
[] add something invalid to sync to snapshot DB

---

## Create mechanism to repair fucked up situations

Unable to synchronize
Found pages in notion that cannot be synchronized with youtube

- do you want to ignore this page?
- do you want to delete this page?

Fucked up DBs

- Delete snapshot DB and load it again with data from mainDB
- Load all videos from youtube and show difference between youtube and main
  - resolve difference
