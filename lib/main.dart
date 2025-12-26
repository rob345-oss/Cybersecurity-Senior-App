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
      ),
      home: const HomeScreen(),
    );
  }
}
