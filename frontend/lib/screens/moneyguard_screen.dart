import 'package:flutter/material.dart';
import '../models/risk_response.dart';
import '../services/api_service.dart';

class MoneyGuardScreen extends StatefulWidget {
  const MoneyGuardScreen({super.key});

  @override
  State<MoneyGuardScreen> createState() => _MoneyGuardScreenState();
}

class _MoneyGuardScreenState extends State<MoneyGuardScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _paymentMethodController = TextEditingController();
  final TextEditingController _recipientController = TextEditingController();
  final TextEditingController _reasonController = TextEditingController();
  final TextEditingController _impersonationTypeController = TextEditingController();
  
  bool _didTheyContactYouFirst = false;
  bool _urgencyPresent = false;
  bool _askedToKeepSecret = false;
  bool _askedForVerificationCode = false;
  bool _askedForRemoteAccess = false;
  
  RiskResponse? _risk;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _paymentMethodController.text = 'zelle';
    _impersonationTypeController.text = 'none';
  }

  @override
  void dispose() {
    _amountController.dispose();
    _paymentMethodController.dispose();
    _recipientController.dispose();
    _reasonController.dispose();
    _impersonationTypeController.dispose();
    super.dispose();
  }

  Future<void> _assessRisk() async {
    if (_amountController.text.trim().isEmpty) {
      setState(() {
        _error = 'Please enter an amount';
      });
      return;
    }

    final amount = double.tryParse(_amountController.text.trim());
    if (amount == null || amount < 0) {
      setState(() {
        _error = 'Please enter a valid amount';
      });
      return;
    }

    if (_recipientController.text.trim().isEmpty) {
      setState(() {
        _error = 'Please enter a recipient';
      });
      return;
    }

    setState(() {
      _loading = true;
      _risk = null;
      _error = null;
    });

    try {
      final response = await _apiService.post(
        'v1/moneyguard/assess',
        {
          'amount': amount,
          'payment_method': _paymentMethodController.text.trim(),
          'recipient': _recipientController.text.trim(),
          'reason': _reasonController.text.trim(),
          'did_they_contact_you_first': _didTheyContactYouFirst,
          'urgency_present': _urgencyPresent,
          'asked_to_keep_secret': _askedToKeepSecret,
          'asked_for_verification_code': _askedForVerificationCode,
          'asked_for_remote_access': _askedForRemoteAccess,
          'impersonation_type': _impersonationTypeController.text.trim(),
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
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070B12),
      appBar: AppBar(
        title: const Text('MoneyGuard'),
        backgroundColor: const Color(0xFF0E1C2F),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Before you send money',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Amount',
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
            TextField(
              controller: _paymentMethodController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Payment method',
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
            TextField(
              controller: _recipientController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Recipient',
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
            TextField(
              controller: _reasonController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Reason',
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
            TextField(
              controller: _impersonationTypeController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Impersonation type',
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
            const SizedBox(height: 24),
            CheckboxListTile(
              title: const Text(
                'They contacted me first',
                style: TextStyle(color: Colors.white70),
              ),
              value: _didTheyContactYouFirst,
              onChanged: (value) {
                setState(() {
                  _didTheyContactYouFirst = value ?? false;
                });
              },
              activeColor: const Color(0xFF00D4FF),
            ),
            CheckboxListTile(
              title: const Text(
                'Urgency present',
                style: TextStyle(color: Colors.white70),
              ),
              value: _urgencyPresent,
              onChanged: (value) {
                setState(() {
                  _urgencyPresent = value ?? false;
                });
              },
              activeColor: const Color(0xFF00D4FF),
            ),
            CheckboxListTile(
              title: const Text(
                'Asked to keep it secret',
                style: TextStyle(color: Colors.white70),
              ),
              value: _askedToKeepSecret,
              onChanged: (value) {
                setState(() {
                  _askedToKeepSecret = value ?? false;
                });
              },
              activeColor: const Color(0xFF00D4FF),
            ),
            CheckboxListTile(
              title: const Text(
                'Asked for verification code',
                style: TextStyle(color: Colors.white70),
              ),
              value: _askedForVerificationCode,
              onChanged: (value) {
                setState(() {
                  _askedForVerificationCode = value ?? false;
                });
              },
              activeColor: const Color(0xFF00D4FF),
            ),
            CheckboxListTile(
              title: const Text(
                'Asked for remote access',
                style: TextStyle(color: Colors.white70),
              ),
              value: _askedForRemoteAccess,
              onChanged: (value) {
                setState(() {
                  _askedForRemoteAccess = value ?? false;
                });
              },
              activeColor: const Color(0xFF00D4FF),
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
              onPressed: _loading ? null : _assessRisk,
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
                  : const Text('Assess Risk'),
            ),
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

