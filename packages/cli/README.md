# MoeMail CLI

Agent-first CLI for MoeMail temporary email service

## Install

```bash
npm i -g moemail-cli
```

## Quick Start

### 1. Configure default domain
```bash
moemail config --domain moemail.app
```

### 2. Create a temporary email
```bash
moemail create --expiry 1h
```

### 3. Wait for messages
```bash
moemail wait --email-id <email_id> --timeout 120
```

## Command Reference

| Command | Description | Key Flags |
|---------|-------------|-----------|
| `config` | Set default domain and options | `--domain <domain>`, `--expiry <duration>` |
| `create` | Create a temporary email address | `--domain <domain>`, `--expiry <duration>`, `--json` |
| `list` | List all temporary emails | `--json` |
| `wait` | Wait for incoming messages | `--email-id <id>`, `--timeout <seconds>`, `--json` |
| `read` | Read email message content | `--email-id <id>`, `--message-id <id>`, `--json` |
| `send` | Send email from temporary address | `--email-id <id>`, `--to <address>`, `--subject <text>`, `--body <text>`, `--json` |
| `delete` | Delete temporary email | `--email-id <id>` |

## Agent Workflow Example

The CLI is designed to support agent-first automation. Here's a typical workflow:

```bash
# Create temporary email and extract details
EMAIL=$(moemail create --domain moemail.app --expiry 1h --json)
EMAIL_ID=$(echo $EMAIL | jq -r '.id')
ADDRESS=$(echo $EMAIL | jq -r '.address')

# Use ADDRESS for signup or service registration...

# Wait for verification email
MSG=$(moemail wait --email-id $EMAIL_ID --timeout 120 --json)
MSG_ID=$(echo $MSG | jq -r '.messageId')

# Read message content
CONTENT=$(moemail read --email-id $EMAIL_ID --message-id $MSG_ID --json)

# Extract verification code from CONTENT...

# Cleanup
moemail delete --email-id $EMAIL_ID
```

## JSON Output

All commands support `--json` flag for structured output, making them ideal for agent automation:

- **Success**: Command output in JSON format to stdout
- **Errors**: Error messages written to stderr
- **Exit Codes**:
  - `0`: Command succeeded
  - `1`: Runtime error (invalid input, service error)
  - `2`: Configuration error (missing domain, invalid credentials)

## Project Links

- **Main Project**: https://github.com/beilunyang/moemail
- **Issues & Feedback**: https://github.com/beilunyang/moemail/issues

## License

MIT
