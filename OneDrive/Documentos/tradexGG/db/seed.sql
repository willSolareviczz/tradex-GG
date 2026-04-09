-- ===== tradexGG Seed Data =====
-- 5 caixas populares do CS2 com skins reais
-- Preços aproximados do mercado em centavos (BRL)
-- Imagens do Steam CDN

-- ===== CASES =====
INSERT INTO cases (name, slug, image_url, price) VALUES
('Caixa Kilowatt', 'kilowatt', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXfj2EZrHSbRthxhbZEDMTuT_h52DHE5tKgpot7HxfAhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-UdsZGHyd4_Bd1RvNQ7T_FDrw-_ng5Pu75ic1zI97bhLkvQz/256fx256f', 990),
('Caixa Revolution', 'revolution', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXfj2EZrHSbRthxhbZEDMTeq_h52CHFp7KAC5O1sgYazZeyIzMdvIW0xtexkdTSxa_Ye-KFxj4J7MQj2rqUrg_h_0Zmam97Z4mVdAM4NwmD-ATWkvDSjJC3ucjGl9C3tA/256fx256f', 890),
('Caixa Dreams & Nightmares', 'dreams-nightmares', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXfj2EZrHSbRthxhbZEDMTuT_h52DB0d-KhJatwqk1hV7D_zxVbUxO4ciyYI2JhPL6MbmDw28AvsN337vEoYz2jlHg-EdoYzz3JNKdcFA6aF2F-APoxb3u0Ja5tJ_MmHJk6CUr5XjblxzghhxKa7Vu/256fx256f', 1290),
('Caixa Fracture', 'fracture', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXfj2EZrHSbRthxhbZEDMTeqn1c9eQQFR6LLofq63xJgUyaTMIW0S0972oWwktTgYbnQ3jMBbMEm3u-TpYnw3Qbt80RramD7cNKSIVU5aV6E-1S_k-q60MSouszFwCs/256fx256f', 690),
('Caixa Clutch', 'clutch', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXfj2EZrHSbRthxhbZEDMTeLrhQ5dQPll6NgtYu7DxfAhjxszMdUEV7925pNKfk6b1a77TwmsIvpN337vEoYz2jFGx-EVkYDvzJYDDewQ3ZVzR_1O5kOy9hZ_v78ycynYx6CQlsCiLzhfk0RxSbuBxxavIcxjC-wc/256fx256f', 590);

-- ===== SKINS =====

-- == Kilowatt Case Skins ==
-- Covert (Red)
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('AK-47 | Inheritance', 'AK-47', 'Inheritance', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXB52GZrHGERC0snYEJ5iDOeepx92CH1R_Ogq5O0h_CiMOSDJGCdI-_xoRjktiPz6OhYu5Vl25u5cBjg_zMyoD0jxqxqhdqMTz0cobNcwY8ZFLX-FjoxO-7g5fo7pScyyZg6yUhsyrfnBep1hxJNbo4YbqHXQ/256fx256f', 45000),
('M4A1-S | Black Lotus', 'M4A1-S', 'Black Lotus', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXBj2Gp3HKealcZ5YDOcdeuqr0hpeCARx7Iw1T-aqx0g_3yITMbtBR_tezkomSxanvMrSIkzoBucF337fE9NWj2wLl-kVkZ2GnJY-VJ1c6aVHS-lbowO270ZTousvJwSdg7CYisiqLyBzk0x8dYOR0xvvJJyf90g/256fx256f', 38000);

-- Classified (Pink)
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('USP-S | Jawbreaker', 'USP-S', 'Jawbreaker', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXMEzq2L2dlxRbbkdKBl3PTfDnx9eCARR_LrVmsaFcJ1n11MbLdDqR7Y6OkdTYxaGmZu2Bx2pd18h_jLiRpN-mjFHm-0FpazilJ4OWdwU5Ml2D81DrlOq9gcW4uZzIyCBk7CQlsiiIy0G90BIaOJVvBrcC0GPHg/256fx256f', 8500),
('AWP | Chrome Cannon', 'AWP', 'Chrome Cannon', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXDnT2LdpY1irhJRKQk_ATNGn_IFCmSdQ-ul2s6fwfAh3xszYOWRHvNm1kYbel6T3NrrQlyVW6p1y2L6ZpIjw3QHir0VpZGyld9ORcA85ZF7S-FC_k-zqgsS5u5_Bm3Rq6yV3ty7ayxHi1h4fJ6Jt0e4F0aXOBg/256fx256f', 12000),
('Sawed-Off | Analog Input', 'Sawed-Off', 'Analog Input', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXDM0qe36Y1irhJFUW5_fVeGpxc2DAQJf-IR5oaOaOBRw3PHddgJb-9C5moWIxvbkY7rQhFRd4cJ5ntbN9J7yjRrl8kVsZWihcITEdQ4-NFjU8wO-l-zqhZHv6J_Pn3Jh7HInsCqMzBK10x5IbsBpxKLKFY6z/256fx256f', 6500);

-- Restricted (Purple)
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('Tec-9 | Slag', 'Tec-9', 'Slag', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXQT22r36Y1irhJFUWZ_fVeGpxc2DB0l6OLxKv7eiLAhhnfCeKIzmcOYR7oWyJwPP9Y-yBwzsCvZQl07vHoY332gLg80RsYmmhI4OUdwYgNVyG_lS-yOi515K8vp2azSdhuSQg4i6Lm0e4hhtJa-5vxKfIHArI/256fx256f', 2200),
('Zeus x27 | Olympus', 'Zeus x27', 'Olympus', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXFT-G-v_Y1irhJFUW5_fVeGpxc2DB0l9IKJG-eTlfwUz2v_Ndj5b4MCyk2JDfxvL2MO2Gzz8EusMk2rnDrIjxil2x5UBtZjynI4WVelI3Z1rUq1Tqw-jq0JW-65vMnXFl7HUk5S3D30vgnEtJbt5txfbMHArISWLy-A/256fx256f', 1800),
('MP5-SD | Liquidation', 'MP5-SD', 'Liquidation', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXBP-APLjIylcQhVdYU_fVeGpx8teCBR_IA1Ov4KVFhfL1ZzRf7dJRtN20x9TYxa-hY-OGxG0AuZcmj-qQoY7x2ALlrxVuMG-mddWUcFk-NV-F_VO-we_rg8K1vZyazCdlpGB25S_D30vg0RxdPON-xKHLHFMn5w/256fx256f', 1500);

-- Mil-Spec (Blue)
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('XM1014 | Iridescent Fade', 'XM1014', 'Iridescent Fade', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXNj-2_32Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbiZzRf7dNSgI24x4Tz26-hYe6Bxm4Gv5Ij2O3E8d-h3lfm80dpam-mJNfGdlM8ZFqD-1K-x-7qjJS7tZqfzXBguSsg4SuMzhC10U8daLZpxa7IFtWi/256fx256f', 350),
('Nova | Dark Sigil', 'Nova', 'Dark Sigil', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXRT-2_32Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbnYzhF7NNch4W0xtSNw_OhYu-BkDMIu8Ry3-nA9IqijRrh-BJuN2ulI4OSegc_YFnXQ-la_xrrs15K56c-YyHJr7Cl2sHuOykC010pNb-Bvxq7IHFNvEj0L/256fx256f', 280),
('MAC-10 | Light Box', 'MAC-10', 'Light Box', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXN-_2r36Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbnYzhF7NJSh4S0xtWSxqGhZ--HxDsAsJUp2L3Ho4yh2wfl-UY5MTzzI4GUJlM3NVvQrle7yOe5h5e5up-cyyRr6CYl5i6OzRPi0EhIOLRuxvbMH0n6Mk9z/256fx256f', 200),
('Dual Berettas | Hideout', 'Dual Berettas', 'Hideout', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXI_j2ulVdKRhUhxfaEB7YQOL_h52DB0p-KBBOv7OdLAhr3uWKHJTtMM7YzZz4b3a7mIk-JRvchTjLuRo4ip3VCw-kRoYTv6I4aVIVQ-N16D-FC4xem8g5e4v8-4upSYynJ9-n51UraelxA/256fx256f', 150);

-- == Revolution Case Skins ==
-- Covert
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('M4A4 | Temukau', 'M4A4', 'Temukau', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXQWX3vTlY1irhJFSUV3fTOuj_IUCTRl97JxFZs7enNAhh3PLddQJb_920k5OKwKXxN7nQhVRd4cJ5ntbN9J7yjRrl8hBqamD7JobDdQA-NV3U_ljvkOm-hJK-vp-aynRmuCAk4C3YyRa_0B5PbeRqxqHEHFPPSWLy-A/256fx256f', 52000),
('AK-47 | Head Shot', 'AK-47', 'Head Shot', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXMT92rr_Y1irhJFSU13PVf-Gn_YVCQGR_I_1KvaqlMV7D7fBSlavWMIt73k5MOLxDmwYu5Vl25u5cBjg_zMyoD0j1q1rkRkMW73J9eVe1M3NV7T-Fm_x-y9g5a_up-bnXVqvHch5SuLzEDi0kxPbOZoxfbMHFO0Rfs/256fx256f', 35000);

-- Classified
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('P250 | Re.built', 'P250', 'Re.built', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXDLX2tlRdMRhYhxJaQE_fVOm_0p2DBRx9IhFTvbSnMBs3szEddPkh7-Jx9TiwKGlMu2IzjMDvsYm0-rD8Yn4jBqy_EBpMGGlddORelNoNArW-FK7we3thZa_6ZucyXM1vCMi4HqLyhC010pJNrpuxq7IHFNv2Snd/256fx256f', 7200),
('MAG-7 | Foresight', 'MAG-7', 'Foresight', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXBPz2dLNY1yrhJFUWB_7VeOql_ItCUhJ9IRVfs7ynNghhnPSdJTtL7NCzlL-YxqWkY-iFwmkBvPB0j-jF-YL0jRrh-BJuN2uhcoHBdAc4Ml-C-VW5wu3shMXu6JyYyXBl7CIh4ivZlxTghB8daOBpx67IHFNvxwv7/256fx256f', 5800);

-- Restricted
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('Glock-18 | Umbral Rabbit', 'Glock-18', 'Umbral Rabbit', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXB_T2tlRdMRhYhxJaQE_fVOm_0p2DBRx9IhFTvbSiMV7i6_NdDgWvIq1xtXYxqChZOyBxW8AucAh0uvAoY-h0VXg_EVpZWzwJ4aXdFI5aFHS_Ae2k-q5hZ--7pucyCNqviMn-z6OzRfi1EhIa-BqxarLHxMk4OQ/256fx256f', 2800),
('MP9 | Featherweight', 'MP9', 'Featherweight', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXQL_2tlRdMRhYhxJaQE_fVOm_0p2DBRx9IhFTvbSnMBs3v_Nfj5S_9e0mIWMwqDxMO3QhFRd4cJ5ntbN9J7yjRrl8hBqamD7JobGdQ07M16D_wK_x-jr0cO-v5-cnHZk7XN25ivD30vgnEtPbOBvxaHLGxCTXF4L/256fx256f', 1500);

-- Mil-Spec
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('FAMAS | Rapid Eye Movement', 'FAMAS', 'Rapid Eye Movement', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXC0v_tlRdMRhYhxJaQE_fVOm_0p2DBRx9IhFTvbSnMBs3v_NdC5R7-OlpOO2PP_MO2IzmNBUsMAhi-qQ8Mak0VXg_EVpZWzwJ4aSdA9-aF3R-1S5xO7r08e4upqbnXZk7XN34yvazEG800xKbeNqxaOcCRCpMws/256fx256f', 320),
('UMP-45 | Wild Child', 'UMP-45', 'Wild Child', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXC0n_tlVdMRhYhxJaQE_fVOm_0p2DBRx9IhFTvbSnMBs3v_NdC5R7-OlpOO2PP_MO2IzmNBUsMAhj7uQ8Mak0VXg_EVpZWzwJ4aQJFRrYl7Y_VO-xei-gJG87pnMm3NrvSAn5inakxW_1h4fJKJvxKbLHYG0Rmw/256fx256f', 250),
('P90 | Neoqueen', 'P90', 'Neoqueen', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXC1_1b1RdMRhYhxJaQE_fVOm_0p2DBRx9IhFTvbSnMBs3v_NdC5R7-OlpOO2PP_MO2IzmNBUsMAhi-qW8Mak0VXg_EVpZWzwJ4aSdA9-aF3R-1S5xO7r08e4upqbnXZk7XN34yvazEG800xKbeNqxaOcCRCpMws/256fx256f', 180);

-- == Dreams & Nightmares Case Skins ==
-- Covert
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('AK-47 | Nightwish', 'AK-47', 'Nightwish', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXNR3G3BdoY1irhJRQQ0_ATOm_18zQhFp7JBBTvKvJIg5njfDMbUR2_9e4kL-Yw6b3N7iJkDkBvpAmi-yW8IKh3g3n_0RoMG2lJIeUdwE2NFnR81G4yOjqjcXp6p2bm3B9-n5ztymJnEe1gktJN-ZvxqWeVh3IyOELO4hC/256fx256f', 42000),
('MP9 | Starlight Protector', 'MP9', 'Starlight Protector', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXVu_j-lVdMRhYhxJaQE_fVOm_18zQhFp7JBBTv73JYgV0xqqQKTxE74ux0tfawKWkZe-CxD0G68Mhi7rH8tSm3lHl_EM6ZW_xLdWLMlhs5hiKp0O3/256fx256f', 32000);

-- Classified
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('USP-S | Ticket to Hell', 'USP-S', 'Ticket to Hell', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXB1j2P1NdMRhYhxJaQE_fVOm_18zQhFp7JBBTvKvJIg5njfDMbUR2_9e4kL-Yw6GnMeyDx28AvsN337vEoYz2jVa38hVpZTildYKXcwc5YFuFrlS-xLu50MK87J-byyFl7HAq4HuImhGx0R9Ia7du1PbMHxOTSmLy-A/256fx256f', 9800),
('FAMAS | Rapid Eye Movement', 'FAMAS', 'Rapid Eye Movement', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXBOb_2lZdMRhYhxJaQE_fVOm_18zQhFp7JBBTvKvJIg5njfDMbUR2_9e4kL-YwPP9Y-yBwjsIvJIh3uvA8I-giwbt-RI_MG_7JtOQelc7NQ6GqVi4krvqg5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 6200);

-- Restricted
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('Five-SeveN | Fairy Tale', 'Five-SeveN', 'Fairy Tale', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXBhf_2lRdMRhYhxJaQE_fVOm_18zQhFp7JBBTv73JYgV0xqqQKTxE74ux0tfawKWkZeyFwj4Bv8ch2L2Uodmk2Ffm-EE-Yj_1JYWSJFM6YVmGqVO7x-juhJ-4u5yYy3J9-n5ztymJnEG1hx4dOOFuxKLLHA/256fx256f', 3200),
('XM1014 | Zombie Offensive', 'XM1014', 'Zombie Offensive', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXVfz_t1ddMRhYhxJaQE_fVOm_18zQhFp7JBBTv73JYgV0xqqQKTxE74ux0tfawKWkZe-CxD0G68Mhi7rH8tSm3lGy_EVpZWzwJ4aSdA9-aF3R-1S5xO7r08e4upqbnXZk7XN34yvazEG800xKbeNqxaOcCRCpMws/256fx256f', 1800);

-- Mil-Spec
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('PP-Bizon | Space Cat', 'PP-Bizon', 'Space Cat', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXGhf_0lZdMRhYhxJaQE_fVOm_18zQhFp7JBBTvKvJIg5njfDMbUR2_9e4kL-Yw_OkN-iHk2kGu5Ah37_H8d-h3Abh-EdpNW_xJoKdJgcgM1GC-FDryOy_gJW87p-dnHdrvCcl5i6IzRy_1h9LaPBuxqvNcV1d/256fx256f', 280),
('Galil AR | Connexion', 'Galil AR', 'Connexion', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXI_z_1VddMRhYhxJaQE_fVOm_18zQhFp7JBBTvKvJIg5njfDMbUR2_9e4kL-YwPP9Y-yBwjsIvJIh3uvA8I-giwbt-RI_MG_7JtOQelc7NQ6GqVi4krvqg5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 220),
('M249 | Downtown', 'M249', 'Downtown', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXGxP_0lddMRhYhxJaQE_fVOm_18zQhFp7JBBTv73JYgV0xqqQKTxE74ux0tfawKWkZe-CxD0G68Mhi7rH8tSm3lHg-kBkYWumcteXcVA4NVvT_li4wee505O_vp6cySZnuCkqsHiPnQe1hBhXaLpv0vbMH0n6Mk9z/256fx256f', 150);

-- == Fracture Case Skins ==
-- Covert
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('Desert Eagle | Printstream', 'Desert Eagle', 'Printstream', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXPkrH3lZdMRhYhxJaQE_fVOm_0p2GUl17KBFTsL-mJAhh3PTddQJb_920k5OKwaTxMu6FxjgJuJB1j-qToY3xigLi_hVlZDjwIYOSeg4-NA7R_Vnvw-_t1cW6u5qamCA96SN17XyOlhTi0kxPP-d30IHIHA/256fx256f', 78000),
('Glock-18 | Vogue', 'Glock-18', 'Vogue', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXPT32r36Y1irhJFUWb_fVeGq10p2CUlR6LAFZsL-mJAhh3PTddQJb_920k5OKwaTxN77QhFRd4cJ5ntbN9J7yjRrl8hBqamD7JobGdQ07M16D_wK_x-jr0cO-v5-cnHZk7XN34yvazEG800xKbeNqxaOcCRCpMws/256fx256f', 25000);

-- Classified
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('Galil AR | Connexion', 'Galil AR', 'Connexion', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXI_z_1VddMRhYhxJaQE_fVOm_18zQhFp7JBBTvKvJIg5njfDMbUR2_9e4kL-YwPP9Y-yBwjsIvJIh3uvA8I-giwbt-RI_MG_7JtOQelc7NQ6GqVi4krvqg5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 5500),
('SSG 08 | Mainframe 001', 'SSG 08', 'Mainframe 001', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXCMz_0FddMRhYhxJaQE_fVOm_0p2GUl17KBFTsL-mJAhh3PTddQJb_920k5OKwPL3Mu6FxjgJuJB1j-qToY3xigLi_hVlZDjwIYOSeg4-NA7R_Vnvw-_t1cW6u5qamCA96SN17XyOlhTi0kxPP-d30IHIHA/256fx256f', 4200);

-- Restricted
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('M4A4 | Tooth Fairy', 'M4A4', 'Tooth Fairy', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXBj_2vVZdMRhYhxJaQE_fVOm_0p2GUl17KBFTsL-mJAhh3PTddQJb_920k5OKwaTxN77QhFRd4cJ5ntbN9J7yjRrl8hBqamD7JobGdQ07M16D_wK_x-jr0cO-v5-cnHZk7XN34yvazEG800xKbeNqxaOcCRCpMws/256fx256f', 2500),
('P90 | Facility Draft', 'P90', 'Facility Draft', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXN--3rlddMRhYhxJaQE_fVOm_0p2GUl17KBFTsL-mJAhh3PTddQJb_920k5OKwaTxN77QhFRd4cJ5ntbN9J7yjRrl8hBqamD7JobGdQ07M16D_wK_x-jr0cO-v5-cnHZk7XN34yvazEG800xKbeNqxaOcCRCpMws/256fx256f', 1600);

-- Mil-Spec
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('SG 553 | Ol Rusty', 'SG 553', 'Ol Rusty', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXN-_2r36Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbnYzhF7NJSh4S0xtWSxqGhZ--HxDsAsJUp2L3Ho4yh2wfl-UY5MTzzI4GUJlM3NVvQrle7yOe5h5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 200),
('Negev | Ultralight', 'Negev', 'Ultralight', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXN-_2r36Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbnYzhF7NJSh4S0xtWSxqGhZ--HxDsAsJUp2L3Ho4yh2wfl-UY5MTzzI4GUJlM3NVvQrle7yOe5h5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 120),
('P250 | Cassette', 'P250', 'Cassette', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXN-_2r36Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbnYzhF7NJSh4S0xtWSxqGhZ--HxDsAsJUp2L3Ho4yh2wfl-UY5MTzzI4GUJlM3NVvQrle7yOe5h5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 100);

-- == Clutch Case Skins ==
-- Covert
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('M4A4 | Neo-Noir', 'M4A4', 'Neo-Noir', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXHBXW-lddMRhYhxJaQE_fV_6l0p2CBRR_LAdKs7-YJAhh3OTHdQJK4dG0j7-PkqbyMO_UxxsBucQjirrp4Mt2m3wfk_0JtZG7yJo-VJgA4NVjT-Ve9kOa815K97p2YyXRh7SN05C3ayhnihhxLPbFoxaPLHxOFRv5w/256fx256f', 28000),
('USP-S | Cortex', 'USP-S', 'Cortex', 'covert', '#eb4b4b', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXCN32rlddMRhYhxJaQE_fV_al0p2CUlR6LABVssLOmJAhh3OTHdQJK4dG0h7-PkqSnMO_UxjsEvMIl0-_E8I6k3QDh-EpsZm_1JdOQdVU4NF_TqAPokejn1pDt7c-dz3Nh6Hcq4HqPzRGw1B9Nb-BvxqCJEhCTRPYZ/256fx256f', 18000);

-- Classified
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('AUG | Stymphalian', 'AUG', 'Stymphalian', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXCN32rlddMRhYhxJaQE_fVeal0p2CUlR6LABVssLOmJAhh3OTHdQJK4dG0h7-PkqSnMO_UxjsEvMIl0-_E8I6k3QDh-EpsZm_1JdOQdVU4NF_TqAPokejn1pDt7c-dz3Nh6Hcq4HqPzRGw1B9Nb-BvxqCJEhCTRPYZ/256fx256f', 5200),
('Glock-18 | Moonrise', 'Glock-18', 'Moonrise', 'classified', '#d32ce6', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXB_z_2lddMRhYhxJaQE_fV_al0p2CUlR6LABVssLOmJAhh3OTHdQJK4dG0h7-PkqSnN77QhFRd4cJ5ntbN9J7yjRrl8hBqamD7JobGdQ07M16D_wK_x-jr0cO-v5-cnHZk7XN34yvazEG800xKbeNqxaOcCRCpMws/256fx256f', 3800);

-- Restricted
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('AWP | Mortis', 'AWP', 'Mortis', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXCMz_0FddMRhYhxJaQE_fVeal0p2CUlR6LABVssLOmJAhh3OTHdQJK4dG0h7-PkqSnMO_UxjsEvMIl0-_E8I6k3QDh-EpsZm_1JdOQdVU4NF_TqAPokejn1pDt7c-dz3Nh6Hcq4HqPzRGw1B9Nb-BvxqCJEhCTRPYZ/256fx256f', 2800),
('MP7 | Bloodsport', 'MP7', 'Bloodsport', 'restricted', '#8847ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXB_z_0FZdMRhYhxJaQE_fVeal0p2CUlR6LABVssLOmJAhh3OTHdQJK4dG0h7-PkqSnMO_UxjsEvMIl0-_E8I6k3QDh-EpsZm_1JdOQdVU4NF_TqAPokejn1pDt7c-dz3Nh6Hcq4HqPzRGw1B9Nb-BvxqCJEhCTRPYZ/256fx256f', 1500);

-- Mil-Spec
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('UMP-45 | Arctic Wolf', 'UMP-45', 'Arctic Wolf', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXN-_2r36Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbnYzhF7NJSh4S0xtWSxqGhZ--HxDsAsJUp2L3Ho4yh2wfl-UY5MTzzI4GUJlM3NVvQrle7yOe5h5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 250),
('Nova | Wild Six', 'Nova', 'Wild Six', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXN-_2r36Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbnYzhF7NJSh4S0xtWSxqGhZ--HxDsAsJUp2L3Ho4yh2wfl-UY5MTzzI4GUJlM3NVvQrle7yOe5h5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 120),
('SG 553 | Aloha', 'SG 553', 'Aloha', 'mil_spec', '#4b69ff', 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UXp-JOjPO0KDiFIbcBdIsq-cSU1_w9aGaMSFcbx9op07YCHaSeLUXN-_2r36Y1irhJFUW5_fVeGpx8teCBR_IA1Ov4KJFhfbnYzhF7NJSh4S0xtWSxqGhZ--HxDsAsJUp2L3Ho4yh2wfl-UY5MTzzI4GUJlM3NVvQrle7yOe5h5e5vJqbm3Nq6XIn5SnYlRy_0UpPOLVvxq7IHFNvJYJD/256fx256f', 80);

-- ===== CASE_SKINS (Junction table with weights) =====
-- Weights based on rarity: Covert=3, Classified=13, Restricted=64, Mil-Spec=320

-- Kilowatt Case (case_id = 1)
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(1, 1, 3), (1, 2, 3),           -- Covert
(1, 3, 13), (1, 4, 13), (1, 5, 13),  -- Classified
(1, 6, 64), (1, 7, 64), (1, 8, 64),  -- Restricted
(1, 9, 320), (1, 10, 320), (1, 11, 320), (1, 12, 320);  -- Mil-Spec

-- Revolution Case (case_id = 2)
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(2, 13, 3), (2, 14, 3),          -- Covert
(2, 15, 13), (2, 16, 13),        -- Classified
(2, 17, 64), (2, 18, 64),        -- Restricted
(2, 19, 320), (2, 20, 320), (2, 21, 320);  -- Mil-Spec

-- Dreams & Nightmares Case (case_id = 3)
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(3, 22, 3), (3, 23, 3),          -- Covert
(3, 24, 13), (3, 25, 13),        -- Classified
(3, 26, 64), (3, 27, 64),        -- Restricted
(3, 28, 320), (3, 29, 320), (3, 30, 320);  -- Mil-Spec

-- Fracture Case (case_id = 4)
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(4, 31, 3), (4, 32, 3),          -- Covert
(4, 33, 13), (4, 34, 13),        -- Classified
(4, 35, 64), (4, 36, 64),        -- Restricted
(4, 37, 320), (4, 38, 320), (4, 39, 320);  -- Mil-Spec

-- Clutch Case (case_id = 5)
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(5, 40, 3), (5, 41, 3),          -- Covert
(5, 42, 13), (5, 43, 13),        -- Classified
(5, 44, 64), (5, 45, 64),        -- Restricted
(5, 46, 320), (5, 47, 320), (5, 48, 320);  -- Mil-Spec
