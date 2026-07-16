def find_first_positive(numbers):
    for n in numbers:
        if n > 0:
            return n
    return -1
