def fibonacci(n):
    if n <= 1:
        return n

    previous = 0
    current = 1

    for _ in range(2, n + 1):
        next_value = previous + current
        previous = current
        current = next_value

    return current

