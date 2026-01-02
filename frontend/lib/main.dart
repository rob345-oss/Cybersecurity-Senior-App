import 'package:flutter/material.dart';

import 'screens/home_screen.dart';
import 'screens/callguard_screen.dart';
import 'screens/inboxguard_screen.dart';
import 'screens/moneyguard_screen.dart';

void main() {
  runApp(const CybersecuritySeniorApp());
}

class CybersecuritySeniorApp extends StatelessWidget {
  const CybersecuritySeniorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Titanium Guardian',
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
      home: const MainNavigationScreen(),
      routes: {
        '/home': (context) => const HomeScreen(),
        '/callguard': (context) => const CallGuardScreen(),
        '/inboxguard': (context) => const InboxGuardScreen(),
        '/moneyguard': (context) => const MoneyGuardScreen(),
      },
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const CallGuardScreen(),
    const InboxGuardScreen(),
    const MoneyGuardScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (int index) {
          setState(() {
            _currentIndex = index;
          });
        },
        backgroundColor: const Color(0xFF0E1C2F),
        indicatorColor: const Color(0xFF00D4FF).withOpacity(0.3),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.phone_outlined),
            selectedIcon: Icon(Icons.phone),
            label: 'CallGuard',
          ),
          NavigationDestination(
            icon: Icon(Icons.email_outlined),
            selectedIcon: Icon(Icons.email),
            label: 'InboxGuard',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'MoneyGuard',
          ),
        ],
      ),
    );
  }
}
