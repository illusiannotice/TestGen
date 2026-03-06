# Publishing to NPM

## Prerequisites

1. **Node.js and npm installed**
   ```bash
   node --version  # Should be 14.6+
   npm --version
   ```

2. **NPM Account**
   - Create account at https://www.npmjs.com/signup
   - Verify email
   - Enable 2FA (recommended)

3. **Git Repository (Optional but recommended)**
   - Initialize git: `git init`
   - Create GitHub/GitLab repo
   - Push your code

## Step-by-Step Publishing

### 1. Login to NPM

```bash
npm login
```

Enter your npm username, password, and 2FA code.

Verify login:
```bash
npm whoami
```

### 2. Update Version

Update `package.json` version following [Semantic Versioning](https://semver.org/):

```json
{
  "version": "1.0.0"
}
```

Or use npm command:
```bash
npm version patch    # 1.0.0 -> 1.0.1
npm version minor    # 1.0.0 -> 1.1.0
npm version major    # 1.0.0 -> 2.0.0
```

### 3. Build the Package

```bash
npm run build
```

This generates the `dist/` folder with compiled TypeScript.

### 4. Test Locally (Optional)

Test before publishing:

```bash
# Link package locally
npm link

# In another project
npm link @testgen/ai
```

### 5. Publish to NPM

```bash
npm publish
```

For **first-time scoped package**:
```bash
npm publish --access public
```

### 6. Verify Publication

Check on https://www.npmjs.com/package/@testgen/ai

Or from command line:
```bash
npm view @testgen/ai
```

## Next Releases

For subsequent releases:

```bash
# 1. Make changes to source code
# 2. Update version
npm version patch

# 3. Rebuild
npm run build

# 4. Publish
npm publish
```

## Automated Publishing (Optional)

### Using GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm install
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then push a tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Troubleshooting

### 403 Forbidden Error

**Cause:** Package name already exists
**Solution:** 
- Choose different package name
- Or become collaborator on existing package

### 402 Payment Required

**Cause:** Trying to publish private package without paid account
**Solution:**
- Publish as public: `npm publish --access public`
- Or upgrade npm account

### Already Published Error

**Cause:** Version already exists
**Solution:** Increment version number

```bash
npm version patch
npm publish
```

### Need to Unpublish?

```bash
npm unpublish @testgen/ai@1.0.0  # Unpublish specific version
npm unpublish @testgen/ai --force  # Unpublish entire package (72h only)
```

## After Publishing

### Update README on npm

Changes to README automatically show on npm page when you publish.

### Add to Package Registry

```bash
npm search @testgen
```

### Create GitHub Release

```bash
git tag v1.0.0
git push origin v1.0.0
# Then create release on GitHub with release notes
```

## Best Practices

✅ **Do:**
- Include comprehensive README
- Add LICENSE file
- Publish with clear version numbers
- Document breaking changes
- Include TypeScript types
- Test before publishing

❌ **Don't:**
- Publish incomplete code
- Skip version updates
- Publish without testing
- Include node_modules
- Use vague version descriptions

## Resources

- [NPM CLI Reference](https://docs.npmjs.com/cli/v10)
- [Semantic Versioning](https://semver.org/)
- [Publishing Packages](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Scoped Packages](https://docs.npmjs.com/about-scopes)

---

**Your package is now ready to be shared with the world! 🚀**
