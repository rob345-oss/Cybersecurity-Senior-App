import 'package:flutter_test/flutter_test.dart';

import 'package:cybersecurity_senior_app/main.dart';

void main() {
  testWidgets('App loads Titanium Guardian shell', (WidgetTester tester) async {
    await tester.pumpWidget(const CybersecuritySeniorApp());
    await tester.pumpAndSettle();

    expect(find.text('Titanium Systems'), findsOneWidget);
  });
}
