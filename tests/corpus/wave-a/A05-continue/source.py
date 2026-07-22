def sum_non_negative(values):
    total = 0
    for value in values:
        if value < 0:
            continue
        total += value
    return total

