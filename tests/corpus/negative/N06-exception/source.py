def guarded(value):
    try:
        return 10 // value
    except ZeroDivisionError:
        return 0

