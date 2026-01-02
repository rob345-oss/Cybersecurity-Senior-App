import 'package:flutter/material.dart';
import '../models/risk_response.dart';
import '../services/api_service.dart';

class InboxGuardScreen extends StatefulWidget {
  const InboxGuardScreen({super.key});

  @override
  State<InboxGuardScreen> createState() => _InboxGuardScreenState();
}

class _InboxGuardScreenState extends State<InboxGuardScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _urlController = TextEditingController();
  RiskResponse? _risk;
  bool _loadingText = false;
  bool _loadingUrl = false;
  String? _error;

  Future<void> _analyzeText() async {
    if (_textController.text.trim().isEmpty) {
      setState(() {
        _error = 'Please enter message text';
      });
      return;
    }

    setState(() {
      _loadingText = true;
      _risk = null;
      _error = null;
    });

    try {
      final response = await _apiService.post(
        'v1/inboxguard/analyze_text',
        {
          'text': _textController.text.trim(),
          'channel': 'sms',
        },
        (json) => RiskResponse.fromJson(json),
      );

      setState(() {
        _risk = response;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('ApiException: ', '');
      });
    } finally {
      setState(() {
        _loadingText = false;
      });
    }
  }

  Future<void> _analyzeUrl() async {
    if (_urlController.text.trim().isEmpty) {
      setState(() {
        _error = 'Please enter a URL';
      });
      return;
    }

    setState(() {
      _loadingUrl = true;
      _risk = null;
      _error = null;
    });

    try {
      final response = await _apiService.post(
        'v1/inboxguard/analyze_url',
        {
          'url': _urlController.text.trim(),
        },
        (json) => RiskResponse.fromJson(json),
      );

      setState(() {
        _risk = response;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('ApiException: ', '');
      });
    } finally {
      setState(() {
        _loadingUrl = false;
      });
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070B12),
      appBar: AppBar(
        title: const Text('InboxGuard'),
        backgroundColor: const Color(0xFF0E1C2F),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Paste a message or URL',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _textController,
              maxLines: 5,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Message text',
                labelStyle: const TextStyle(color: Colors.white70),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.white38),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.white38),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF00D4FF)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadingText ? null : _analyzeText,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00D4FF),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
              child: _loadingText
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Analyze Message'),
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _urlController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'URL',
                labelStyle: const TextStyle(color: Colors.white70),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.white38),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.white38),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF00D4FF)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadingUrl ? null : _analyzeUrl,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00D4FF),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
              child: _loadingUrl
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Analyze URL'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            ],
            if (_risk != null) ...[
              const SizedBox(height: 32),
              _buildRiskCard(_risk!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRiskCard(RiskResponse risk) {
    Color riskColor;
    switch (risk.level) {
      case 'low':
        riskColor = Colors.green;
        break;
      case 'medium':
        riskColor = Colors.orange;
        break;
      case 'high':
        riskColor = Colors.red;
        break;
      default:
        riskColor = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: riskColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  risk.level.toUpperCase(),
                  style: TextStyle(
                    color: riskColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Score: ${risk.score}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Reasons:',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          ...risk.reasons.map((reason) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  '• $reason',
                  style: const TextStyle(color: Colors.white70),
                ),
              )),
          const SizedBox(height: 16),
          const Text(
            'Next Action:',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            risk.nextAction,
            style: const TextStyle(color: Colors.white70),
          ),
          if (risk.recommendedActions.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Recommended Actions:',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            ...risk.recommendedActions.map((action) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        action.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        action.detail,
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

