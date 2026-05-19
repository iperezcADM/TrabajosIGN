"""
Calculadora estética de consola para pruebas rápidas.

Características:
- Interfaz de menú en consola con colores ANSI
- Operaciones: + - * / ^ %
- Historial de operaciones
- Manejador de errores y formato limpio

No depende de librerías externas; usa códigos ANSI si el terminal los soporta.
"""

import os
import math
import sys

CSI = "\x1b["
RESET = CSI + "0m"
BOLD = CSI + "1m"
CYAN = CSI + "96m"
GREEN = CSI + "92m"
YELLOW = CSI + "93m"
RED = CSI + "91m"
MAGENTA = CSI + "95m"

def clear():
    try:
        os.system('cls' if os.name == 'nt' else 'clear')
    except Exception:
        pass

def header():
    print(BOLD + CYAN + '╔' + '═' * 46 + '╗' + RESET)
    print(BOLD + CYAN + '║' + RESET + ' ' * 10 + BOLD + 'CALCULADORA FERRETERÍA' + RESET + ' ' * 9 + BOLD + CYAN + '║' + RESET)
    print(BOLD + CYAN + '╚' + '═' * 46 + '╝' + RESET)

def menu():
    print()
    print(GREEN + 'Operaciones disponibles:' + RESET)
    print(f" {YELLOW}1{RESET}  Suma (a + b)")
    print(f" {YELLOW}2{RESET}  Resta (a - b)")
    print(f" {YELLOW}3{RESET}  Multiplicación (a * b)")
    print(f" {YELLOW}4{RESET}  División (a / b)")
    print(f" {YELLOW}5{RESET}  Potencia (a ^ b)")
    print(f" {YELLOW}6{RESET}  Porcentaje (a % de b)")
    print(f" {YELLOW}7{RESET}  Historial")
    print(f" {YELLOW}8{RESET}  Limpiar pantalla")
    print(f" {YELLOW}0{RESET}  Salir")

def read_number(prompt):
    while True:
        val = input(prompt).strip()
        try:
            # accept comma as decimal separator
            val_clean = val.replace(',', '.')
            num = float(val_clean)
            return num
        except ValueError:
            print(RED + 'Entrada no válida. Ingresa un número.' + RESET)

def format_num(n):
    if abs(n) >= 1e6 or (0 < abs(n) < 1e-4):
        return f"{n:.6e}"
    return f"{n:,.6f}".rstrip('0').rstrip('.')

def main():
    history = []
    while True:
        clear()
        header()
        menu()
        choice = input('\nSelecciona una opción: ').strip()
        if choice == '0':
            print(CYAN + '\nGracias por usar la calculadora. ¡Hasta luego!' + RESET)
            break

        if choice == '7':
            clear()
            header()
            print(BOLD + MAGENTA + 'Historial de operaciones:' + RESET)
            if not history:
                print(YELLOW + '  - Vacío -' + RESET)
            else:
                for i, item in enumerate(history[-20:], 1):
                    print(f" {i}. {item}")
            input('\nPresiona Enter para volver...')
            continue

        if choice == '8':
            continue

        ops = {'1': '+', '2': '-', '3': '*', '4': '/', '5': '^', '6': '%'}
        if choice not in ops:
            print(RED + 'Opción no válida.' + RESET)
            input('Presiona Enter para continuar...')
            continue

        a = read_number('Ingresa el primer número: ')
        b = read_number('Ingresa el segundo número: ')

        try:
            if choice == '1':
                res = a + b
            elif choice == '2':
                res = a - b
            elif choice == '3':
                res = a * b
            elif choice == '4':
                if b == 0:
                    raise ZeroDivisionError('División por cero')
                res = a / b
            elif choice == '5':
                res = math.pow(a, b)
            elif choice == '6':
                # a % de b => (a/100)*b  OR interpret as a * b / 100
                res = (a / 100.0) * b
            else:
                res = 0

        except Exception as e:
            print(RED + f'Error: {e}' + RESET)
            input('Presiona Enter para continuar...')
            continue

        expr = f"{format_num(a)} {ops[choice]} {format_num(b)} = {format_num(res)}"
        history.append(expr)

        print('\n' + BOLD + CYAN + 'Resultado' + RESET + ':')
        print(BOLD + GREEN + '  ' + expr + RESET)
        input('\nPresiona Enter para continuar...')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n' + CYAN + 'Salida interrumpida. Adiós.' + RESET)
        sys.exit(0)
