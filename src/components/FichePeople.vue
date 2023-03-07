<template>
  <q-card :class="'row items-start ' + dkli(idx)">

    <div class="col-auto column items-center q-pr-sm">
      <img class="photomax" :src="photo" />
      <q-btn class="q-mt-sm" dense size="sm" color="primary" icon="more_horiz">
        <q-menu transition-show="scale" transition-hide="scale" v-model="menuOuvert">
          <div class="menu column cursor-pointer font-calibri-l">
            <div v-if="!compta" class="column fs-md text-italic">{{$t('ARDnf')}}</div>
            <div v-if="compta && naTribu" class="item row items-center" v-close-popup @click="ouvrirArdoise">
              <q-icon class="col-auto" size="md" name="chat"/>
              <span class="col q-pl-sm">{{$t('ARDoat')}}</span>
              <q-separator/>
            </div>
            <div v-if="compta" class="item row items-center" v-close-popup @click="ouvrirCompta">
              <q-icon class="col-auto" size="md" name="euro"/>
              <span class="col q-pl-sm">{{$t('ARDafc')}}</span>
              <q-separator/>
            </div>
            <div v-if="compta" class="item row items-center" v-close-popup @click="ouvrirBlocage">
              <q-icon class="col-auto" size="md" name="lock_open"/>
              <span class="col q-pl-sm">{{$t('ARDafb')}}</span>
            </div>
          </div>
        </q-menu>
      </q-btn>
    </div>

    <div class="col column">
      <div>
        <info-txt class="titre-md" :label="people.na.nomc" :info="'ID: ' + people.na.id"/>
        <span v-if="nomTribu" class="q-ml-sm titre-md">({{nomTribu}})</span>
        <span v-if="clicMenu && !nomTribu" class="q-ml-sm titre-md text italic">({{$t('ARDtri')}})</span>
        <span v-if="estPrimaire" class="q-ml-sm titre-md">{{$t('FPEprim')}}</span>
      </div>
      <show-html v-if="info" class="q-my-xs bord" :idx="idx" zoom maxh="4rem" :texte="info"/>
      <div v-else class="text-italic fs-sm">{{$t('FAnocv')}}</div>
      <q-separator class="q-my-xs"/>
      <div class="column" v-if="people.cpIds" >
        <div v-for="cp in peopleSt.getCouples(people.na.id)" :key="cp.na.id">
          <span class="text-italic">{{$t('PCav', [$t('STCP' + cp.stp), cp.npiE ? $t('personnel') : ''])}}</span>
          <span class="titre-md q-ml-sm">{{cp.naI.nomc}}</span>
        </div>
      </div>
      <div class="column" v-if="people.mbIds" >
        <div class="q-mt-xs" v-for="mb in peopleSt.getMembres(people.na.id)" :key="mb.na.id">
          <span class="text-italic">{{$t('PCmb', [$t('STMB' + mb.stp), mb.npi ? $t('personnel') : ''])}}</span>
          <span class="titre-md q-ml-sm" >{{mb.na.nomc}}</span>
        </div>
      </div>
    </div>

  </q-card>
</template>
<script>

import { toRef } from 'vue'
import ShowHtml from './ShowHtml.vue'
import InfoTxt from './InfoTxt.vue'
import stores from '../stores/stores.mjs'
import { IDCOMPTABLE } from '../app/api.mjs'
import { GetCompta } from '../app/operations.mjs'
import { afficherDiag } from '../app/util.mjs'
import { getNg } from '../app/modele.mjs'

export default {
  name: 'FichePeople',
  components: { ShowHtml, InfoTxt },

  props: { people: Object, idx: Number },

  computed: {
    photo () { return this.people.cv && this.people.cv.cv ? this.people.cv.cv[0] : this.phdef },
    info () { return this.people.cv && this.people.cv.cv ? this.people.cv.cv[1] : '' },
    nomTribu () {
      const n = this.session.compte.nat ? this.session.compte.nat.nom : ''
      return this.aMemeTribu ? n : (this.naTribu ? this.naTribu.nom : '')
    }
  },

  watch: {
    menuOuvert (ap, av) {     
      if (ap) {
        this.estSponsor = false
        this.naTribu = null
        this.estPrimaire = false
        this.aMemeTribu = false
        this.compta = null
        this.parrainTribu()
      }
    }
  },
  
  data () {
    return {
      compta: null,
      menuOuvert: false,
      estSponsor: false,
      naTribu: null,
      estPrimaire: false,
      aMemeTribu: false,
      clicMenu: false,
    }
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    /*
    nomc (id) {
      const cp = this.couple(id)
      return cp ? cp.naI.nomc : ('??@' + ('' + id).substring(0, 4))
    },
    nomg (pk) { 
      const na = getNg(pk.substring(0, pk.indexOf('/')))
      return na ? na.nomc : ('??@' + ('' + id).substring(0, 4))
    },

    couple (id) { return stores.couple.getCouple(id) },
    statutCP (id) {
      const cp = this.couple(id)
      return this.$t('STCP' + cp.stp)
    },

    membre (pk) { 
      const { id, id2 } = splitPK(pk)
      return stores.groupe.getMembre(id, id2)
    },
    statutMB (pk) {
      const mb = this.membre(pk)
      return !mb ? '???' : this.$t('STMB' + mb.stp)
    },
    */
    async ouvrirArdoise () {
      let ok = false
      if (this.session.estComptable) {
        ok = true
      } else {
        if (!this.session.estSponsor || !this.aMemeTribu) {
          await afficherDiag(this.$t('FPEppa'))
        } else {
          ok = true
        }
      }
      if (ok) this.ui.ouvrirArdoiseTribu(this.compta, this.naTribu)
    },
    ouvrirCompta () {

    },
    ouvrirBlocage () {

    },

    /* 
    Obtient estSponsor, naTribu, estPrimaire, aMemeTribu ET éventuellement compta 
    Invoquée à chaque ouverture du menu (avant choix d'une option).
    Complète l'information tribu / parrain à l'affichage
    */
    async parrainTribu () {
      if (!await this.session.aut(4, true)) return false
      const id = this.people.na.id
      const c = this.session.compte
      this.clicMenu = true

      if (id === IDCOMPTABLE) { // l'avatar pointé est le comptable
        this.estSponsor = true
        this.estPrimaire = true
        return true
      }

      if (c.estAc(id)) { // l'avatar pointé est un des avatars du compte
        // MAIS normalement désormais les avatars du compte NE SONT PLUS dans people
        this.estSponsor = c.estSponsor
        this.naTribu = c.nat
        this.estPrimaire = id === c.id
        this.aMemeTribu = true
        return true
      }

      if (!this.session.auts(4, true)) return false
      // l'avatar pointé N'EST PAS est un des avatars du compte, il faut aller chercher sa compta
      await this.autCompta()
      const idt = this.compta ? this.compta.t : 0
      if (idt) {
        this.estPrimaire = true
        this.aMemeTribu = c.estComptable ? false : (idt === c.nat.id)
        // const [parrain, nctk] = await new GetTribuCompte().run(id)
        if (c.estComptable) {
          this.naTribu = getNg(idt)
        } else {
          this.naTribu = this.aMemeTribu ? c.nat : null
        }
        this.estSponsor = this.naTribu ? parrain : 0 // ???????????????????????????????????????
      }
    },

    async autCompta (check) {
      if (!await this.session.aut(4, true)) return
      const id = this.people.na.id
      const c = this.session.compte
      if (!this.compta) this.compta = await new GetCompta().run(id)
      if (c.estComptable || !check) return
      if (id === IDCOMPTABLE) { await afficherDiag(this.$t('ARDm1')); return }
      if (!c.stp) { await afficherDiag(this.$t('ARDm2')); return }
      if (!this.compta || this.compta.t !== c.nat.id) { await afficherDiag(this.$t('ARDm2')); return }
    },
  },

  setup (props) {
    const ui = stores.ui
    const p = toRef(props, 'people')
    const session = stores.session
    const peopleSt = stores.people
    // console.log(p.value.na.nom)
    return {
      phdef: stores.config.iconAvatar,
      ui,
      session,
      peopleSt,
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bord2p
  border-radius: 3px
  border: 2px solid $warning
  font-weight: bold
  padding: 1px 3px
.ptim
  font-variant: small-caps
.menu
  min-width: 15rem
  padding: 3px
  border-radius: 3px
  border: 1px solid $grey-5
</style>
