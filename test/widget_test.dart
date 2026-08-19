import 'package:flutter_test/flutter_test.dart';

import 'package:my_closet/app.dart';

void main() {
  testWidgets('App builds and shows home placeholder', (WidgetTester tester) async {
    await tester.pumpWidget(const MyClosetApp());

    expect(find.text('나의 옷장'), findsWidgets);
  });
}
