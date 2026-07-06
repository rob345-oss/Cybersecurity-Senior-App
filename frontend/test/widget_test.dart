import 'package:flutter_test/flutter_test.dart';

import 'package:cybersecurity_senior_app/main.dart';

void main() {
  testWidgets('App loads with navigation destinations', (WidgetTester tester) async {
    await tester.pumpWidget(const CybersecuritySeniorApp());
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('CallGuard'), findsOneWidget);
  });
}
