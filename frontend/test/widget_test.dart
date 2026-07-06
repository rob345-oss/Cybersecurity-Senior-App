import 'package:flutter_test/flutter_test.dart';

import 'package:cybersecurity_senior_app/main.dart';

void main() {
  testWidgets('App loads with navigation destinations', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const CybersecuritySeniorApp());
    await tester.pump();

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('CallGuard'), findsWidgets);
  });
}
