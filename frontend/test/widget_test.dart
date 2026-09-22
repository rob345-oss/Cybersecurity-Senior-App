import 'package:flutter_test/flutter_test.dart';
import 'package:cybersecurity_senior_app/main.dart';

void main() {
  testWidgets('app loads Titanium Guardian home', (WidgetTester tester) async {
    await tester.pumpWidget(const CybersecuritySeniorApp());
    await tester.pumpAndSettle();

    expect(find.textContaining('Titanium'), findsWidgets);
  });
}
