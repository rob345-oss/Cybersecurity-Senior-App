# Privacy Policy

**Last Updated:** [Current Date]

## Overview

Titanium Guardian is committed to protecting your privacy and the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect data when you use our cybersecurity risk assessment services.

## Information We Collect

### Personal Information
- **User Identifiers**: Unique user IDs and device IDs associated with your sessions
- **Contact Information**: Email addresses and phone numbers (when provided for IdentityWatch assessments)
- **Session Data**: Risk assessment events, timestamps, and risk scores

### Technical Information
- **Device Information**: Device identifiers used to track sessions
- **Usage Data**: Information about how you interact with our services, including:
  - URLs analyzed for phishing threats
  - Text content from emails/messages (for analysis purposes)
  - Call signals and patterns
  - Financial transaction details (for risk assessment)

### Sensitive Data
We may process sensitive personal information including:
- Email addresses
- Phone numbers
- Financial transaction amounts
- Identity verification signals

## How We Use Your Information

We use the information we collect to:

1. **Provide Risk Assessment Services**: Analyze potential security threats, phishing attempts, and fraud risks
2. **Improve Our Services**: Enhance our risk detection algorithms and assessment accuracy
3. **Session Management**: Track and manage active risk assessment sessions
4. **Security and Compliance**: Ensure the security of our systems and comply with legal obligations

## Data Storage and Security

### Encryption
- **Sensitive Data Encryption**: All personally identifiable information (PII) is encrypted at rest using industry-standard encryption (Fernet symmetric encryption)
- **Encrypted Fields**: The following fields are automatically encrypted when stored:
  - User IDs
  - Device IDs
  - Email addresses
  - Phone numbers
  - Account numbers
  - Social Security Numbers (if provided)
  - Other sensitive identifiers

### Storage Duration
We implement strict data retention policies to minimize data storage:

- **Active Sessions**: Retained based on session TTL (default: 24 hours of inactivity)
- **Maximum Session Age**: All sessions are automatically deleted after a maximum age (default: 48 hours)
- **Event Data**: Risk assessment events are retained for a limited period (default: 30 days)
- **PII Retention**: Personally identifiable information is retained for a maximum period (default: 90 days)

### Data Deletion
Data is automatically deleted according to our retention policies:
- Background cleanup processes run hourly
- Expired sessions are automatically removed
- Old events beyond retention periods are purged
- All deletion is permanent and cannot be recovered

## Data Sharing and Disclosure

We do not sell, trade, or rent your personal information to third parties. We may share data only in the following circumstances:

1. **Service Providers**: With trusted service providers who assist in operating our services (under strict confidentiality agreements)
2. **Legal Requirements**: When required by law, court order, or government regulation
3. **Security**: To protect the rights, property, or safety of our users, ourselves, or others

## Your Rights

Depending on your jurisdiction, you may have the following rights regarding your personal data:

1. **Right to Access**: Request access to your personal data
2. **Right to Rectification**: Request correction of inaccurate data
3. **Right to Erasure**: Request deletion of your personal data
4. **Right to Data Portability**: Request a copy of your data in a structured format
5. **Right to Object**: Object to processing of your personal data

To exercise these rights, please contact us using the information provided in the "Contact Us" section.

## API Security

### Authentication
- All API requests require authentication via API key (X-API-Key header)
- API keys must be kept secure and not shared

### Rate Limiting
- API endpoints are rate-limited to prevent abuse
- Rate limits vary by endpoint (typically 50-200 requests per minute)

### Input Validation
- All user inputs are validated and sanitized
- HTML tags and dangerous content are automatically removed
- Length limits are enforced on all input fields

## Data Retention Configuration

Data retention policies can be configured via environment variables:

- `SESSION_TTL_HOURS`: Session inactivity timeout (default: 24 hours)
- `MAX_SESSION_AGE_HOURS`: Maximum session age (default: 48 hours)
- `EVENT_RETENTION_DAYS`: Event data retention (default: 30 days)
- `PII_RETENTION_DAYS`: PII retention period (default: 90 days)
- `ENABLE_DATA_ENCRYPTION`: Enable/disable encryption (default: true)
- `ENCRYPTION_KEY`: Encryption key for data at rest (required for production)

You can view current retention policies by calling the `/v1/data-retention/policy` API endpoint.

## Compliance

We are committed to compliance with applicable data protection regulations including:
- **GDPR** (General Data Protection Regulation) - for EU users
- **CCPA** (California Consumer Privacy Act) - for California residents
- Other applicable regional privacy laws

## Children's Privacy

Our services are not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.

## International Data Transfers

Your data may be processed and stored in servers located outside your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify users of any material changes by:
- Posting the updated policy on our website
- Updating the "Last Updated" date
- For significant changes, we may provide additional notice via email or through our services

## Data Breach Notification

In the event of a data breach that poses a risk to your personal information, we will:
1. Investigate the breach immediately
2. Notify affected users within 72 hours (as required by applicable law)
3. Report to relevant regulatory authorities as required
4. Take immediate steps to remediate the breach

## Cookies and Tracking Technologies

We may use cookies and similar tracking technologies to:
- Maintain session state
- Improve service functionality
- Analyze service usage

You can control cookie settings through your browser preferences.

## Third-Party Services

Our services may integrate with third-party services. These services have their own privacy policies. We encourage you to review their policies to understand how they handle your data.

## Security Best Practices

To help protect your data:
- Use strong, unique API keys
- Rotate API keys regularly
- Keep your authentication credentials secure
- Use HTTPS when transmitting data
- Report any suspected security vulnerabilities immediately

## Contact Us

For questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

- **Email**: [privacy@titaniumguardian.com]
- **Address**: [Company Address]
- **Data Protection Officer**: [DPO Contact Information]

## Data Processing Lawful Basis

Under GDPR and similar regulations, we process your personal data based on:
- **Legitimate Interest**: To provide cybersecurity risk assessment services
- **Consent**: Where you have provided explicit consent
- **Contractual Necessity**: To fulfill our service obligations
- **Legal Obligation**: To comply with applicable laws and regulations

## Data Minimization

We practice data minimization principles:
- We only collect data necessary for risk assessment purposes
- We do not store data longer than necessary
- We automatically purge data according to retention policies
- We use pseudonymization where possible

## Your Consent

By using our services, you consent to the collection and use of information in accordance with this Privacy Policy.

---

**Note**: This is a technical privacy policy for the Titanium Guardian API. For a user-facing privacy policy for end-user applications, additional customization may be required based on your specific use case and legal requirements.

