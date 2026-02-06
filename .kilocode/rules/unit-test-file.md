---
trigger: always_on
glob:
description:
---

# for test-script

0. Write a `README.MD` in the test folder to document the scope of each test case.
1. **Location**: Place in `project root dir` > `test-script`.
2. **Naming**: All test scripts must end with `.test.ts`.
3. **Execution**: Use a unified command to start tests, such as `bun test`.
4. **Organization**: Categorize by target:
   * `auth/` for authentication tests
   * `bot/` for bot logic and assets
   * `core-api/` for API server/client tests
   * `webhook/` for webhook tests
   * `repro/` for reproduction scripts
5. For reusable test cases, please keep them within their respective folders.