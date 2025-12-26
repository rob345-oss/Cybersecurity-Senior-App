import 'package:flutter/material.dart';

void main() {
  runApp(const CybersecuritySeniorApp());
}

class CybersecuritySeniorApp extends StatelessWidget {
  const CybersecuritySeniorApp({super.key});

  @override
  Widget build(BuildContext context) {
    const sampleCode = '''
// Example Flutter UI so you can see the code rendered in-app.
class ExampleWidget extends StatelessWidget {
  const ExampleWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const Text('Hello, Flutter!');
  }
}
''';

    return MaterialApp(
      title: 'Cybersecurity Senior App',
      theme: ThemeData.dark(),
      home: const CodePreviewScreen(code: sampleCode),
    );
  }
}

class CodePreviewScreen extends StatelessWidget {
  const CodePreviewScreen({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Code Preview'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: SelectableText(
            code,
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 14,
              height: 1.4,
            ),
          ),
        ),
      ),
    );
  }
}
