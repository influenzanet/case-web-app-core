import React from 'react';
import { Avatar, containerClassName } from '@influenzanet/case-web-ui';
import { Navbar } from 'react-bootstrap';
import clsx from 'clsx';
import { Profile } from '../../../api/types/user';
import { AvatarConfig } from '../../../types/appConfig';

interface SurveyModeNavbarProps {
  onExit: () => void;
  labels: {
    exitSurveyModeBtn: string;
    selectedProfilePrefix: string;
  };
  avatars: AvatarConfig[];
  currentProfile?: Profile;
}



const SurveyModeNavbar: React.FC<SurveyModeNavbarProps> = (props) => {

  const profilePreview = <React.Fragment>
    <div className={clsx("d-none d-sm-inline px-2 d-flex align-items-center text-white fs-btn",
      //styles.navText
    )}>
      {props.labels.selectedProfilePrefix}
    </div>

    <ul className="nav nav-tabs h-100  navlink-container">
      <li className="nav-item navlink-container h-100">
        <div
          className="nav-link py-2 active border-2 border-secondary d-flex align-items-center text-decoration-none"
        >

          <Avatar
            avatars={props.avatars}
            avatarId={props.currentProfile?.avatarId ? props.currentProfile?.avatarId : 'default'}
            className="m-0 me-md-2"
          />

          <span className="d-none d-md-inline-block text-truncate"
            style={{ maxWidth: 200 }}
          >
            {props.currentProfile?.alias}
          </span>
        </div>

      </li>
    </ul>
  </React.Fragment>

  return (
    <Navbar bg="primary" className="p-0">
      <div className={containerClassName}>
        <div className="d-flex align-items-center w-100">
          <ul className="nav nav-tabs ">
            <li className="nav-item navlink-container">
              <button
                type="button"
                className="nav-link d-flex align-items-center text-decoration-none ps-0 py-2"
                onClick={props.onExit}>

                <span className="material-icons me-1">{'keyboard_backspace'}</span>
                {props.labels.exitSurveyModeBtn}
              </button>
            </li>
          </ul>

          <div className="flex-grow-1" ></div>

          {props.currentProfile !== undefined ? profilePreview : null}
        </div>
      </div>
    </Navbar>
  );
};

export default SurveyModeNavbar;
