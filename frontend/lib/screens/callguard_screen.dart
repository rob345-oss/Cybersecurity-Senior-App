import 'package:flutter/material.dart';
import '../models/risk_response.dart';
import '../services/api_service.dart';
import 'dart:convert';

class CallGuardScreen extends StatefulWidget {
  const CallGuardScreen({super.key});

  @override
  State<CallGuardScreen> createState() => _CallGuardScreenState();
}

class _CallGuardScreenState extends State<CallGuardScreen> {
  final ApiService _apiService = ApiService();
  final Set<String> _selectedSignals = {};
  RiskResponse? _risk;
  bool _loading = false;
  String? _sessionId;
  String? _error;

  final List<String> _signals = [
    'urgency',
    'bank_impersonation',
    'government_impersonation',
    'tech_support',
    'remote_access_request',
    'verification_code_request',
    'gift_cards',
    'crypto_payment',
    'threats_or_arrest',
    'too_good_to_be_true',
    'asks_to_keep_secret',
    'caller_id_mismatch',
  ];

  Future<void> _startSession() async {
    if (_selectedSignals.isEmpty) {
      setState(() {
        _error = 'Please select at least one signal';
      });
      return;
    }

    setState(() {
      _loading = true;
      _risk = null;
      _error = null;
    });

    try {
      // Start session
      final sessionResponse = await _apiService.post(
        'v1/session/start',
        {
          'user_id': '00000000-0000-0000-0000-000000000000', // TODO: Get from auth
          'device_id': 'flutter',
          'module': 'callguard',
          'context': null,
        },
        (json) => SessionStartResponse.fromJson(json),
      );

      setState(() {
        _sessionId = sessionResponse.sessionId;
      });

      // Send events for each selected signal
      for (final signal in _selectedSignals) {
        final eventResponse = await _apiService.post(
          'v1/session/${sessionResponse.sessionId}/event',
          {
            'type': 'signal',
            'payload': {'signal_key': signal},
            'timestamp': DateTime.now().toUtc().toIso8601String(),
          },
          (json) => RiskResponse.fromJson(json),
        );

        setState(() {
          _risk = eventResponse;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('ApiException: ', '');
        _sessionId = null;
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  void _toggleSignal(String signal) {
    setState(() {
      if (_selectedSignals.contains(signal)) {
        _selectedSignals.remove(signal);
      } else {
        _selectedSignals.add(signal);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070B12),
      appBar: AppBar(
        title: const Text('CallGuard'),
        backgroundColor: const Color(0xFF0E1C2F),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'I\'m on a call — help me',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tap any signals you recognize while you\'re on the line.',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _signals.map((signal) {
                final isSelected = _selectedSignals.contains(signal);
                return FilterChip(
                  label: Text(signal.replaceAll('_', ' ')),
                  selected: isSelected,
                  onSelected: (_) => _toggleSignal(signal),
                  selectedColor: const Color(0xFF00D4FF).withOpacity(0.3),
                  checkmarkColor: const Color(0xFF00D4FF),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.white70,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
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
            ElevatedButton(
              onPressed: _loading || _selectedSignals.isEmpty ? null : _startSession,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00D4FF),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
              child: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Start Live Session'),
            ),
            if (_sessionId != null) ...[
              const SizedBox(height: 16),
              Text(
                'Session ID: $_sessionId',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
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
          if (risk.safeScript != null) ...[
            const SizedBox(height: 16),
            const Text(
              'Safe Script:',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0E243C),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Say this:',
                    style: TextStyle(
                      color: Color(0xFF00D4FF),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    risk.safeScript!.sayThis,
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'If they push back:',
                    style: TextStyle(
                      color: Color(0xFF00D4FF),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    risk.safeScript!.ifTheyPushBack,
                    style: const TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

