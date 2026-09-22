import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cybersecurity_senior_app/main.dart';

void main() {
  testWidgets('Titanium Guardian app builds', (WidgetTester tester) async {
    // Use a desktop-sized surface so marketing layout widgets do not overflow.
    tester.view.physicalSize = const Size(1280, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const CybersecuritySeniorApp());
    await tester.pump();

    expect(find.byType(CybersecuritySeniorApp), findsOneWidget);
    expect(find.text('CallGuard'), findsOneWidget);
  });
}
