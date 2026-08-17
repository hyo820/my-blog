---
title: 파이썬 자료구조 팁
date: 2026-02-10
tags: python, blog
---

# 파이썬 자료구조 팁

자주 쓰는 파이썬 자료구조를 정리해봅니다.

1. 리스트: 순서가 있는 가변 컬렉션
2. 튜플: 순서가 있는 불변 컬렉션
3. 딕셔너리: 키-값 쌍 저장

```python
# 딕셔너리에서 값 꺼내기
def get_or_default(data, key, default=None):
    if key in data:
        return data[key]
    return default

config = {"debug": True, "port": 8080}
print(get_or_default(config, "port"))
```

> `dict.get(key, default)`을 쓰면 더 짧게 쓸 수 있습니다.
