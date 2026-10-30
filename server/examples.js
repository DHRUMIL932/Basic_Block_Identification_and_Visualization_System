// Example TAC programs served by GET /api/examples
module.exports={
'Sequential':'1: a = b + c\n2: d = a * 2\n3: print d',
'Conditional branch':'1: a = b + c\n2: if a < 10 goto 6\n3: d = a * 2\n4: e = d + 5\n5: goto 7\n6: d = a - 2\n7: print d',
'If / else':'1: x = a + b\n2: if x > 10 goto 5\n3: y = x - 1\n4: goto 6\n5: y = x + 1\n6: z = y * 2\n7: print z',
'Counted loop':'1: i = 0\n2: if i >= 10 goto 6\n3: print i\n4: i = i + 1\n5: goto 2\n6: return',
'Multiple branches':'1: a = 0\n2: if a == 0 goto 6\n3: if a > 5 goto 8\n4: b = a + 1\n5: goto 9\n6: b = 1\n7: goto 9\n8: b = 2\n9: print b'};
