def mark_seen(numbers):
    seen = 0
    for n in numbers:
        if n > 0:
            seen = 1
    return seen
