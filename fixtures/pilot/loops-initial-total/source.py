def count_passing(scores):
    total = 10
    for score in scores:
        if score >= 50:
            total = total + 1
    return total

result = count_passing([72, 41, 65, 38])
