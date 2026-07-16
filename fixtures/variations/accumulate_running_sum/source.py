def running_sum(readings):
    accumulator = 0
    for reading in readings:
        accumulator = accumulator + reading
    return accumulator
