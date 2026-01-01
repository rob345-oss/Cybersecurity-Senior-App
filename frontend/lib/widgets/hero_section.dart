import 'package:flutter/material.dart';

class HeroSection extends StatelessWidget {
  const HeroSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 5,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Semantics(
                label: 'Key features: Threat Intelligence, SOC Automation, Zero Trust',
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: const Text(
                    'Threat Intelligence • SOC Automation • Zero Trust',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Semantics(
                heading: true,
                level: 1,
                child: Text(
                  'Cybersecurity operations built for relentless resilience.',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        height: 1.1,
                        color: Colors.white,
                      ),
                ),
              ),
              const SizedBox(height: 16),
              Semantics(
                label: 'Titanium Systems orchestrates detection, response, and recovery for modern enterprises. Unify telemetry, automate playbooks, and keep critical services secure.',
                child: Text(
                  'Titanium Systems orchestrates detection, response, and recovery for modern enterprises. '
                  'Unify telemetry, automate playbooks, and keep critical services secure.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.white70,
                        height: 1.6,
                      ),
                ),
              ),
              const SizedBox(height: 24),
              Wrap(
                spacing: 12,
                children: [
                  Semantics(
                    button: true,
                    label: 'Request a demo of the Titanium Systems platform',
                    child: FilledButton(
                      onPressed: () {},
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF00D4FF),
                        foregroundColor: const Color(0xFF030713),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 14,
                        ),
                      ),
                      child: const Text('Request a Demo'),
                    ),
                  ),
                  Semantics(
                    button: true,
                    label: 'View the Titanium Systems platform features',
                    child: OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 22,
                          vertical: 14,
                        ),
                        side: const BorderSide(color: Colors.white38),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('View Platform'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: const [
                  _MetricTile(label: 'Telemetry sources', value: '2,400+'),
                  _MetricTile(label: 'Avg. response time', value: '4.6 min'),
                  _MetricTile(label: 'Automation coverage', value: '78%'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: 32),
        Expanded(
          flex: 4,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Semantics(
                  heading: true,
                  level: 2,
                  child: Text(
                    'Live Security Posture',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
                const SizedBox(height: 16),
                _StatusRow(
                  label: 'Critical alerts',
                  value: '06',
                  color: const Color(0xFFFF6B6B),
                ),
                const SizedBox(height: 12),
                _StatusRow(
                  label: 'Open investigations',
                  value: '18',
                  color: const Color(0xFFFFD166),
                ),
                const SizedBox(height: 12),
                _StatusRow(
                  label: 'Automations running',
                  value: '145',
                  color: const Color(0xFF06D6A0),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: const Color(0xFF0F1B2D),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: Semantics(
                    label: 'Automated response summary',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Automated response summary',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        SizedBox(height: 12),
                        _SummaryItem(label: 'Containment actions', value: '42'),
                        _SummaryItem(label: 'User risk reduced', value: '31%'),
                        _SummaryItem(label: 'Incidents closed', value: '128'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label: $value',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: Colors.white.withOpacity(0.06),
          border: Border.all(color: Colors.white10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white60,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  String _getColorDescription() {
    if (color == const Color(0xFFFF6B6B)) return 'critical';
    if (color == const Color(0xFFFFD166)) return 'warning';
    if (color == const Color(0xFF06D6A0)) return 'success';
    return 'status';
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label: $value, $_colorDescription() status',
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white70,
                ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              value,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  const _SummaryItem({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label: $value',
      child: Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white60,
                  ),
            ),
            Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
