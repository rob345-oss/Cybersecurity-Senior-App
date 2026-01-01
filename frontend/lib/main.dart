import 'package:flutter/material.dart';

import 'screens/home_screen.dart';

void main() {
  runApp(const CybersecuritySeniorApp());
}

class CybersecuritySeniorApp extends StatelessWidget {
  const CybersecuritySeniorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cybersecurity Senior App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF070B12),
        textTheme: ThemeData.dark().textTheme.copyWith(
              displaySmall: const TextStyle(fontSize: 40),
              titleLarge: const TextStyle(fontSize: 26),
            ),
        // Enhanced focus indicators for keyboard navigation accessibility
        focusColor: const Color(0xFF00D4FF),
        // Ensure buttons have visible focus indicators
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            foregroundColor: Colors.white,
          ).copyWith(
            side: WidgetStateProperty.resolveWith<BorderSide>(
              (Set<WidgetState> states) {
                if (states.contains(WidgetState.focused)) {
                  return const BorderSide(color: Color(0xFF00D4FF), width: 2);
                }
                return BorderSide.none;
              },
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.white,
          ).copyWith(
            side: WidgetStateProperty.resolveWith<BorderSide>(
              (Set<WidgetState> states) {
                if (states.contains(WidgetState.focused)) {
                  return const BorderSide(color: Color(0xFF00D4FF), width: 3);
                }
                return const BorderSide(color: Colors.white38);
              },
            ),
          ),
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
