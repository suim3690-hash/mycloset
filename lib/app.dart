import 'package:flutter/material.dart';

class MyClosetApp extends StatelessWidget {
  const MyClosetApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '나의 옷장',
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple)),
      home: const _HomePlaceholder(),
    );
  }
}

class _HomePlaceholder extends StatelessWidget {
  const _HomePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('나의 옷장')),
      body: const Center(child: Text('프로젝트 초기 설정 완료')),
    );
  }
}
