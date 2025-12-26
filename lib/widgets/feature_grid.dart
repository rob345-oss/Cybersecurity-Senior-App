import 'package:flutter/material.dart';

class FeatureGrid extends StatelessWidget {
  const FeatureGrid({super.key, this.titleStyle});

  final TextStyle? titleStyle;

  @override
  Widget build(BuildContext context) {
    final features = [
      _FeatureCardData(
        title: 'Unified Telemetry',
        description: 'Collect endpoint, cloud, identity, and OT signals in real time.',
        icon: Icons.hub_outlined,
      ),
      _FeatureCardData(
        title: 'Adaptive Response',
        description: 'Trigger orchestrated actions and playbooks across your stack.',
        icon: Icons.bolt_outlined,
      ),
      _FeatureCardData(
        title: 'Executive Reporting',
        description: 'Translate risk into business outcomes with board-ready insights.',
        icon: Icons.analytics_outlined,
      ),
      _FeatureCardData(
        title: 'Continuous Validation',
        description: 'Simulate attack paths and validate controls without downtime.',
        icon: Icons.route_outlined,
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'A Titanium Systems command center',
          style: titleStyle?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ) ??
              const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Everything your security team needs to stay ahead of active threats.',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.white70,
              ),
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 20,
          runSpacing: 20,
          children: features
              .map(
                (feature) => _FeatureCard(data: feature),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _FeatureCardData {
  const _FeatureCardData({
    required this.title,
    required this.description,
    required this.icon,
  });

  final String title;
  final String description;
  final IconData icon;
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.data});

  final _FeatureCardData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white.withOpacity(0.05),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF0E243C),
              border: Border.all(color: Colors.white12),
            ),
            child: Icon(data.icon, color: const Color(0xFF00D4FF)),
          ),
          const SizedBox(height: 16),
          Text(
            data.title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            data.description,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white70,
                  height: 1.4,
                ),
          ),
        ],
      ),
    );
  }
}
