import type { Type } from '@nestjs/common';
import { EVENT_HANDLER_METADATA } from '../../decorators';
import type { EventHandlerMetadata, IEventHandler } from '../../interfaces';

export const getEventHandlerMetadata = (eventHandler: Type<IEventHandler>): EventHandlerMetadata => {
	return Reflect.getMetadata(EVENT_HANDLER_METADATA, eventHandler) ?? {};
};
