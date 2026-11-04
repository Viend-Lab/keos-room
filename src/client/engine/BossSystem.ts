import type { BossBehaviorState, EvaluationAction, InspectionOutcome } from '../../types';
import { BOSS_PATROL_WAYPOINTS, EXECUTIVE_OFFICE, Point } from './officeLayout';

export interface EmployeeEvaluationSubject {
  id: string;
  name: string;
  roleTitle: string;
  mood: string;
  energy: number;
  stress: number;
  x: number;
  z: number;
}

export interface BossSystemCallbacks {
  getEmployees: () => EmployeeEvaluationSubject[];
  getEmployee: (id: string) => EmployeeEvaluationSubject | null;
  onScold: (outcome: InspectionOutcome, subject: EmployeeEvaluationSubject) => void;
  onCoffeeGift: (outcome: InspectionOutcome, subject: EmployeeEvaluationSubject) => void;
  onStateChange?: (newState: BossBehaviorState, oldState: BossBehaviorState) => void;
  onMoveTo?: (point: Point, speed: number) => void;
}

export const COOLDOWN_DURATION_MS = 90000; // 90 seconds per employee cooldown
export const INSPECTION_RADIUS = 2.4; // Detection radius in meters
export const IN_OFFICE_DURATION_SECONDS = 30; // Desk stay duration
export const INTERACTION_PAUSE_SECONDS = 4.0; // Reprimand or coffee handover duration

export class BossSystem {
  public state: BossBehaviorState = 'IN_OFFICE';
  public stateTimer: number = IN_OFFICE_DURATION_SECONDS;
  public currentWaypointIndex: number = 0;
  public targetEmployeeId: string | null = null;
  public inspectionCooldowns: Map<string, number> = new Map();

  // Boss coordinate position in office space
  public x: number = EXECUTIVE_OFFICE.seatX;
  public z: number = EXECUTIVE_OFFICE.seatZ;

  private callbacks: BossSystemCallbacks;
  private nowProvider: () => number;

  constructor(callbacks: BossSystemCallbacks, nowProvider: () => number = () => Date.now()) {
    this.callbacks = callbacks;
    this.nowProvider = nowProvider;
  }

  public getBossState(): BossBehaviorState {
    return this.state;
  }

  public setState(newState: BossBehaviorState) {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState, oldState);
    }
  }

  /**
   * Evaluates an employee against productivity/rest criteria.
   * Enforces 90s interaction cooldown per employee.
   */
  public evaluateEmployee(employeeId: string): InspectionOutcome {
    const subject = this.callbacks.getEmployee(employeeId);
    if (!subject) {
      return {
        targetId: employeeId,
        action: 'IGNORE',
        dialogueText: '',
        badgeToken: '[NEUTRAL]',
        stressDelta: 0,
        energyDelta: 0,
        newMood: 'FOKUS'
      };
    }

    const now = this.nowProvider();
    const lastChecked = this.inspectionCooldowns.get(employeeId) || 0;
    if (now - lastChecked < COOLDOWN_DURATION_MS) {
      return {
        targetId: employeeId,
        action: 'IGNORE',
        dialogueText: '',
        badgeToken: '[NEUTRAL]',
        stressDelta: 0,
        energyDelta: 0,
        newMood: 'FOKUS'
      };
    }

    // Disciplinary trigger: sleeping, slacking, or severely exhausted
    const isSleepingOrSlacking = subject.mood === 'TIDUR' || subject.mood === 'MALAS' || subject.mood === 'LELAH' || subject.energy < 20;

    if (isSleepingOrSlacking) {
      this.inspectionCooldowns.set(employeeId, now);
      return {
        targetId: employeeId,
        action: 'SCOLD',
        badgeToken: '[SCOLD]',
        dialogueText: `[SCOLD] Hey ${subject.name}, bangun! Jam kerja bukan buat tidur!`,
        stressDelta: 20,
        energyDelta: 35,
        newMood: 'KAGET'
      };
    }

    // Appreciation trigger: focused with strong energy / high performance
    const isProductive = subject.mood === 'FOKUS' && subject.energy >= 50;
    if (isProductive) {
      this.inspectionCooldowns.set(employeeId, now);
      return {
        targetId: employeeId,
        action: 'COFFEE_GIFT',
        badgeToken: '[COFFEE_GIFT]',
        dialogueText: `[COFFEE_GIFT] Kerja bagus ${subject.name}! Ini kopi spesial buat kamu, teruskan performanya.`,
        stressDelta: -30,
        energyDelta: Math.max(0, 100 - subject.energy),
        newMood: 'SENANG'
      };
    }

    return {
      targetId: employeeId,
      action: 'IGNORE',
      dialogueText: '',
      badgeToken: '[NEUTRAL]',
      stressDelta: 0,
      energyDelta: 0,
      newMood: 'FOKUS'
    };
  }

  /**
   * Main update tick for Boss state machine.
   */
  public update(delta: number) {
    this.stateTimer -= delta;

    switch (this.state) {
      case 'IN_OFFICE': {
        if (this.stateTimer <= 0) {
          this.setState('WALKING_OUT');
          this.currentWaypointIndex = 0;
          this.stateTimer = 0;
        }
        break;
      }

      case 'WALKING_OUT': {
        // Walk towards door
        const targetPoint = BOSS_PATROL_WAYPOINTS[0]; // Doorway exit
        if (this.moveToward(targetPoint, delta, 1.8)) {
          this.setState('PATROLLING');
          this.currentWaypointIndex = 1;
        }
        break;
      }

      case 'PATROLLING': {
        // While walking patrol waypoints, check for nearby employees
        const nearbySubject = this.findNearbyEmployee();
        if (nearbySubject) {
          const outcome = this.evaluateEmployee(nearbySubject.id);
          if (outcome.action === 'SCOLD') {
            this.targetEmployeeId = nearbySubject.id;
            this.setState('SCOLDING');
            this.stateTimer = INTERACTION_PAUSE_SECONDS;
            this.callbacks.onScold(outcome, nearbySubject);
            return;
          } else if (outcome.action === 'COFFEE_GIFT') {
            this.targetEmployeeId = nearbySubject.id;
            this.setState('GIFTING_COFFEE');
            this.stateTimer = INTERACTION_PAUSE_SECONDS;
            this.callbacks.onCoffeeGift(outcome, nearbySubject);
            return;
          }
        }

        // Navigate along patrol waypoints
        const waypoint = BOSS_PATROL_WAYPOINTS[this.currentWaypointIndex];
        if (!waypoint) {
          this.setState('RETURNING');
          return;
        }

        if (this.moveToward(waypoint, delta, 1.6)) {
          this.currentWaypointIndex++;
          if (this.currentWaypointIndex >= BOSS_PATROL_WAYPOINTS.length) {
            this.setState('RETURNING');
          }
        }
        break;
      }

      case 'SCOLDING':
      case 'GIFTING_COFFEE': {
        if (this.stateTimer <= 0) {
          this.targetEmployeeId = null;
          this.setState('PATROLLING');
        }
        break;
      }

      case 'RETURNING': {
        // Return to executive desk
        const deskSeat: Point = { x: EXECUTIVE_OFFICE.seatX, z: EXECUTIVE_OFFICE.seatZ };
        if (this.moveToward(deskSeat, delta, 1.8)) {
          this.setState('IN_OFFICE');
          this.stateTimer = IN_OFFICE_DURATION_SECONDS;
          this.currentWaypointIndex = 0;
        }
        break;
      }
    }
  }

  private moveToward(target: Point, delta: number, speed: number): boolean {
    const dx = target.x - this.x;
    const dz = target.z - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.15) {
      this.x = target.x;
      this.z = target.z;
      return true;
    }

    const step = Math.min(dist, speed * delta);
    this.x += (dx / dist) * step;
    this.z += (dz / dist) * step;

    if (this.callbacks.onMoveTo) {
      this.callbacks.onMoveTo({ x: this.x, z: this.z }, speed);
    }
    return false;
  }

  private findNearbyEmployee(): EmployeeEvaluationSubject | null {
    const employees = this.callbacks.getEmployees();
    const now = this.nowProvider();

    for (const emp of employees) {
      if (emp.id === 'bos') continue;
      const lastCheck = this.inspectionCooldowns.get(emp.id) || 0;
      if (now - lastCheck < COOLDOWN_DURATION_MS) continue;

      const dist = Math.hypot(emp.x - this.x, emp.z - this.z);
      if (dist <= INSPECTION_RADIUS) {
        return emp;
      }
    }
    return null;
  }
}
