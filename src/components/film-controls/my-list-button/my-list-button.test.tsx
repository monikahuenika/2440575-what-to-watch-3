import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { withProviders } from '../../../utils/mock-component.tsx';
import MyListButton from './index.tsx';
import { mockFilmDetails, mockUserDetails } from '../../../utils/mock-data.ts';
import { AuthorizationStatus } from '../../../types/user.ts';
import { loadFavoriteFilms, setIsFavorite } from '../../../store/api-actions.ts';
import { extractActionsTypes } from '../../../utils/mock-reducer.ts';
import { AppRoutes } from '../../../types/routes.ts';
import * as faker from 'faker';
import { StatusCodes } from 'http-status-codes';

describe('Component: MyListButton', () => {
  const mockedListLength = faker.datatype.number();
  const mockedFilmDetails = mockFilmDetails();
  const mockedUserDetails = mockUserDetails();

  it('should render correctly', () => {
    const { component } = withProviders(<MyListButton listLength={mockedListLength} />, {
      film: {
        selectedFilm: mockedFilmDetails
      },
      user: {
        ...mockedUserDetails,
        authorizationStatus: AuthorizationStatus.Authorized,
      },
    });

    render(component);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('My list')).toBeInTheDocument();
    expect(screen.getByText(mockedListLength)).toBeInTheDocument();
  });

  it('should change favorite film list when authorized user clicks on the button', async () => {
    const { component, mockStore, mockAxiosAdapter } =
      withProviders(
        <MyListButton listLength={mockedListLength} />,
        {
          film: {
            selectedFilm: {
              ...mockedFilmDetails,
              isFavorite: true,
            }
          },
          user: {
            ...mockedUserDetails,
            authorizationStatus: AuthorizationStatus.Authorized,
          },
        });
    mockAxiosAdapter.onPost(/\/favorite/).reply(StatusCodes.OK);
    mockAxiosAdapter.onGet(/\/favorite/).reply(StatusCodes.OK);

    render(component);
    await userEvent.click(screen.getByRole('button'));
    const actions = extractActionsTypes(mockStore.getActions());

    expect(actions).toEqual([
      setIsFavorite.pending.type,
      setIsFavorite.fulfilled.type,
      loadFavoriteFilms.pending.type,
      loadFavoriteFilms.fulfilled.type,
    ]);
  });

  it('should redirect to login page when guest clicks on the button', async () => {
    const { component, mockStore, mockHistory } = withProviders(<MyListButton listLength={mockedListLength} />, {
      film: {
        selectedFilm: {
          ...mockedFilmDetails,
          isFavorite: false,
        }
      },
      user: {
        ...mockedUserDetails,
        authorizationStatus: AuthorizationStatus.Unauthorized,
      },
    });

    render(component);
    await userEvent.click(screen.getByRole('button'));
    const actions = extractActionsTypes(mockStore.getActions());
    expect(mockHistory.location.pathname).toBe(AppRoutes.SignIn);
    expect(actions).toEqual([]);
  });
});
