def count_positive(numbers):
    count = 0
    for n in numbers:
        if n > 0:
            count = count + 1
    return count
