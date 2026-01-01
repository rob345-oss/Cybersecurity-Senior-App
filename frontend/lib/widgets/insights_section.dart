import 'package:flutter/material.dart';

class InsightsSection extends StatelessWidget {
  const InsightsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final insights = [
      _InsightCardData(
        title: 'Identity-first protection',
        description:
            'Map every user, device, and workload to a verified trust score.',
      ),
      _InsightCardData(
        title: 'Defense in depth',
        description:
            'Layered segmentation and micro-perimeters keep threats contained.',
      ),
      _InsightCardData(
        title: 'Always-on assurance',
        description:
            'Continuous control validation keeps compliance teams aligned.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: Colors.white10),
        color: const Color(0xFF0B1626),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            heading: true,
            level: 2,
            child: Text(
              'Built for Titanium-scale teams',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          const SizedBox(height: 8),
          Semantics(
            label: 'Accelerate your SOC with guided workflows, AI-assisted analysis, and unified reporting.',
            child: Text(
              'Accelerate your SOC with guided workflows, AI-assisted analysis, and unified reporting.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white70,
                  ),
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 20,
            runSpacing: 20,
            children: insights
                .map(
                  (insight) => _InsightCard(data: insight),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _InsightCardData {
  const _InsightCardData({required this.title, required this.description});

  final String title;
  final String description;
}

class _InsightCard extends StatelessWidget {
  const _InsightCard({required this.data});

  final _InsightCardData data;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '${data.title}: ${data.description}',
      child: Container(
        width: 240,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: Colors.white.withOpacity(0.04),
          border: Border.all(color: Colors.white10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                    color: Colors.white60,
                    height: 1.4,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
