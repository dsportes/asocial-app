<template>
<div :class="dkli + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOfictit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOfictit2', [groupe.na.nomc])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="ro!==0 || exv!==0" inset
      class="full-width bg-yellow-5 text-black titre-md text-bold">
      <div class="row justify-center">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
        <span>{{$t('PNOro' + ro)}}</span>
        <span>{{$t('PNOexv2' + exv)}}</span>
      </div>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs column items-center">
      <q-btn v-if="!cx1()" flat dense color="primary" class="q-mt-sm" size="md" icon="add"
        label="Ajouter un fichier" @click="nomfic='';saisiefichier=true"/>
      <div v-for="(it, idx) in state.listefic" :key="it.nom" class="full-width">
        <div class="row">
          <q-expansion-item :default-opened="!idx" group="fnom" class="col" switch-toggle-side
            header-class="expansion-header-class-1 titre-md bg-secondary text-white">
            <template v-slot:header>
              <q-item-section>
                <div class="row justify-between items-center">
                  <div class="col titre-lg text-bold">{{it.n}}</div>
                  <div class="col-auto row items-center">
                    <div class="col fs-md q-mr-md">
                      {{$t('PNFnbv', PNFit.l.length, { count: PNFit.l.length})}}
                    </div>
                  </div>
                </div>
              </q-item-section>
            </template>
            <q-card-section>
              <div class="row items-center">
                <toggle-btn :src="it.avn" color="warning" :args="it" @change="avnom"
                  :lecture="!(session.synchro || (session.avion && it.avn))" 
                  :label="$t('PNFl1')" :label-off="$t('PNFl2')"/>
              </div>
              <div v-for="(f, idy) in it.l" :key="f.idf" class="ma-qcard-section q-my-sm">
                <q-separator class="q-mb-sm"/>
                <div class="row justify-between items-center">
                  <div class="col">
                    <span class="text-bold q-pr-lg">{{f.info}}</span>
                    <span class="fs-md">{{edvol(f.lg)}} - {{f.type}} - </span>
                    <span class="font-mono fs-sm">{{f.idf}}</span>
                  </div>
                  <div class="col-auto font-mono fs-sm">{{dhcool(f.dh)}}</div>
                </div>
                <div class="row justify-between">
                  <div class="col row items-center">
                    <toggle-btn :src="f.av" :args="f" color="warning" @change="avidf"
                      :lecture="!(session.synchro || (session.avion && f.av))"
                      :label="$t('PNFl3')"
                      :label-off="it.avn && idy === 0 ? $t('PNFl4') : $t('PNFl5')"/>
                  </div>
                  <div class="col-auto row justify-end q-gutter-xs">
                    <q-btn size="sm" dense color="primary" icon="content_copy" :label="$t('PNFcop')" @click="copierFic(f)"/>
                    <q-btn size="sm" dense color="primary" icon="open_in_new" :label="$t('PNFaff')" @click="affFic(f)"/>
                    <q-btn size="sm" dense color="primary" icon="save" :label="$t('PNFenreg')" @click="enregFic(f)"/>
                    <q-btn size="sm" dense color="warning" icon="delete" :label="$t('PNFsuppr')" @click="supprFic(f)"/>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-expansion-item>
        </div>
      </q-page>
  </q-page-container>

  <q-dialog v-model="saisiefichier">
    <fichier-attache :secret="secret" :close="fermerfa"/>
  </q-dialog>

</q-layout>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
// import BoutonUndo from '../components/BoutonUndo.vue'
import { MajNote } from '../app/operations.mjs'
import { UNITEV2 } from '../app/api.mjs'

export default {
  name: 'NoteFichier',

  components: { 
    BoutonHelp, 
    // BoutonUndo
  },

  props: { ro: Number },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modifie () { return false }
  },

  watch: {
  },

  methods: {
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },
    async valider () {
      /*
      const dv = this.texte.length - this.nSt.note.txt.length
      if (this.er && dv > 0) {
        await afficherDiag($t('PNOw' + this.er))
        return
      }
      if (this.type === 5) {
        const n = this.erGr(dv)
        if (n === 6) {
          await afficherDiag($t('PNOer11'))
          return
        }
      }
      if (this.type === 4) {
        const c = this.aSt.compta.compteurs
        if (c.v1 + dv > c.q1 * UNITEV1) {
          await afficherDiag($t('PNOer10'))
          return
        }
      }
      const idc = this.avatar ? this.session.compteId : this.groupe.idh
      const n = this.nSt.note
      await new MajNote()
        .run(n.id, n.ids, this.im, n.auts, this.texte, this.prot, idc)
      */
      MD.fD()
    }
  },

  data () {
    return {
      texte: '',
    }
  },

  setup (props) {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const avnSt = stores.avnote

    const ro = toRef(props, 'ro')
    const state = reactive({
      avn: null,
      listefic: []
    })

    const avatar = ref(null)
    const groupe = ref(null)
    const exv = ref(0)

    if (nSt.node.type === 4) {
      if (ro.value === 0 && aSt.exV2) exv.value = 1
      avatar.value = aSt.getElt(nSt.note.id).avatar
    } else if (nSt.node.type === 5) {
      groupe.value = gSt.egr(nSt.note.id).groupe
      if (ro.value === 0 && ergrV2()) exv.value = 2
    }

    function ergrV2 (dv) {
      const g = groupe.value
      const eg = gSt.egr(g.id)
      if (eg.objv.vols.v2 + dv >= eg.objv.vols.q2 * UNITEV2) return true
      return false
    }

    function initState () {
      const n = nSt.note
      state.avn = avnSt.getAvnote(n.id, n.ids)
      state.listefic = listefichiers(n, state.av)
    }

    function listefichiers (n, avn) {
      const lst = []
      const mnom = {}
      for (const [idf, x] of n.mfa) {
        /* mfa : Map de clé idf : { nom, info, dh, type, gz, lg, sha } */
        const f = s.mfa.get(idf)
        let e = mnom[f.nom]; if (!e) { e = []; mnom[f.nom] = e; lst.push(f.nom) }
        const av = avn && (avn.lidf.indexOf(idf) !== -1) ? true : false
        e.push({ ...f, idf, av })
      }
      lst.sort((a, b) => { return a < b ? -1 : (a > b ? 1 : 0) })
      const res = []
      lst.forEach(nom => {
        const l = mnom[nom]
        const avn = avn && avn.mnom[nom] ? true : false
        l.sort((a, b) => { return a.dh < b.dh ? 1 : (a.dh > b.dh ? -1 : 0) })
        res.push({ n, l, av: avs && avs.mnom[n], avn })
      })
      return res
    }

    initState()

    nSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setNote')){
         const n = args[0]
         if (n.key === nSt.note.key) initState()
        }
      })
    })

    avnSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setAvnote')){
         const n = args[0]
         if (n.key === nSt.note.key) initState()
        }
      })
    })

    return {
      ui, session, nSt, aSt, gSt, avnSt,
      exv, avatar, groupe, state,
      MD, ergrV2
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.mh
  max-height: 3.2rem
  width: 15rem
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.bord2
  border: 3px solid $warning
  border-radius: 5px
.dec
  position: relative
  left: -7px
</style>
