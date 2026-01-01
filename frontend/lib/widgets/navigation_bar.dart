import 'package:flutter/material.dart';

class HomeNavigationBar extends StatelessWidget {
  const HomeNavigationBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      label: 'Main navigation bar',
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Semantics(
            label: 'Titanium Systems logo and company name',
            child: Row(
              children: [
                Semantics(
                  label: 'Security shield icon representing Titanium Systems',
                  excludeSemantics: true,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF00D4FF), Color(0xFF0077FF)],
                      ),
                    ),
                    child: const Icon(
                      Icons.security,
                      color: Colors.white,
                      semanticLabel: 'Security shield icon',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'Titanium Systems',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                      ),
                ),
              ],
            ),
          ),
          Semantics(
            label: 'Navigation menu',
            child: Wrap(
              spacing: 16,
              children: const [
                _NavItem(label: 'Platform'),
                _NavItem(label: 'Solutions'),
                _NavItem(label: 'Resources'),
                _NavItem(label: 'Contact'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Navigate to $label page',
      child: Focus(
        child: InkWell(
          onTap: () {
            // Navigation can be implemented here
          },
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white70,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
        ),
      ),
    );
  }
}
