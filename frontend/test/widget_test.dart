import 'package:flutter_test/flutter_test.dart';

import 'package:cybersecurity_senior_app/main.dart';

void main() {
  testWidgets('App loads home navigation', (WidgetTester tester) async {
    await tester.pumpWidget(const CybersecuritySeniorApp());

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('CallGuard'), findsOneWidget);
  });
}
