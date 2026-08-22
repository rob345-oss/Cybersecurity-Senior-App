import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cybersecurity_senior_app/main.dart';

void main() {
  testWidgets('App loads home screen', (WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(1400, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const CybersecuritySeniorApp());
    await tester.pump();

    expect(find.byType(CybersecuritySeniorApp), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
  });
}
