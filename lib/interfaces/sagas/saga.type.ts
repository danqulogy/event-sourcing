import { Observable } from 'rxjs';
import { ICommand } from '../commands';
import { IEvent } from '../events';

export type ISaga<EventBase extends IEvent = IEvent, CommandBase extends ICommand = ICommand> = (
	events$: Observable<EventBase>,
) => Observable<CommandBase>;
