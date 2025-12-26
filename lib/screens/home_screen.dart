import 'package:flutter/material.dart';

import '../widgets/feature_grid.dart';
import '../widgets/footer_section.dart';
import '../widgets/hero_section.dart';
import '../widgets/insights_section.dart';
import '../widgets/navigation_bar.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF070B12),
      body: SafeArea(
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Color(0xFF070B12),
                Color(0xFF0B1524),
                Color(0xFF0E1C2F),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  const HomeNavigationBar(),
                  const SizedBox(height: 32),
                  const HeroSection(),
                  const SizedBox(height: 40),
                  FeatureGrid(
                    titleStyle: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: 40),
                  const InsightsSection(),
                  const SizedBox(height: 48),
                  const FooterSection(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
