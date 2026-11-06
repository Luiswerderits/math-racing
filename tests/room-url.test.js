import {describe,it,expect} from 'vitest';
import {getRoomFromUrl} from '../src/systems/room-url.js';
describe('getRoomFromUrl',()=>{it('normalizes a valid room code',()=>expect(getRoomFromUrl('?room=a7k92p')).toBe('A7K92P'));it('rejects invalid codes',()=>expect(getRoomFromUrl('?room=xy')).toBe(''));});