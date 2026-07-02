import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cybersecurity_senior_app/main.dart';

void main() {
  testWidgets('App loads home screen', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1400, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(const CybersecuritySeniorApp());
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('CallGuard'), findsOneWidget);
  });
}
